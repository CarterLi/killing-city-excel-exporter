'use strict';
const htmlparser2 = require('htmlparser2');
const request = require('request');
const xl = require('excel4node');
const fs = require('fs');
const domain = 'http://xmdswiki.opd2c.com';
const storage = {
    total: undefined,
    received: 0,
    parsed: 0
};
const errors = {
    unexpectedError: [],
    noContent: []
};
function rp(url, options) {
    return new Promise(function resolver(resolve, reject) {
        request(url, options, (error, response, body) => {
            if (error || response.statusCode !== 200) {
                reject(error);
            }
            else {
                resolve(body);
            }
        });
    });
}
function dfs(dom, condition) {
    let result;
    if (dom.some(node => {
        if (node.type === "tag") {
            if (condition(node)) {
                result = node;
                return true;
            }
            if (node.children && node.children.length) {
                result = dfs(node.children, condition);
                return !!result;
            }
        }
    })) {
        return result;
    }
}
function getValueByAttributeName(box, attribute) {
    return dfs(box.children, elem => elem.name === 'span'
        && elem.children[0].data === attribute).next.next;
}
function padLeft(str, char, len) {
    return char.repeat(len - str.length) + str;
}
function counter(key) {
    ++storage[key];
    process.stdout.write(`Total: ${storage.total}; Received: ${storage.received}; Parsed: ${storage.parsed}; Percentage: ${(storage.received / storage.total * 100).toFixed(2)}%\u001b[0G`);
}
;
function logError(msg, err) {
    console.error(msg, err);
}
function generateIDs() {
    const result = new Array(1200 + 100);
    storage.total = result.length;
    for (let i = 0; i < 1200; ++i)
        result[i] = i + 1;
    for (let i = 1200; i < 1300; ++i)
        result[i] = i - 1200 + 3000 + 1;
    return result;
}
const titles = [
    'ID', '名称', '稀有度', '属性', '类型', '念力值', 'MinHP', 'MaxHP', 'MinATK', 'MaxATK',
    'MinHeal', 'MaxHeal', 'MaxLV', '技能名称', '技能说明', '技能初始回合数',
    '技能Max时回合数', '技能最大lv', '队长技能', '队长技能说明', '大插图', '小插图'
];
Promise.all(generateIDs()
    .map((ID, _) => new Promise(resolve => setTimeout(resolve, _ * 100))
    .then(() => rp(`${domain}/index.php?r=cards%2Fdetail&roleid=${ID}`, { gzip: true }))
    .catch(err => {
    errors.unexpectedError.push(ID);
    throw err;
})
    .then(result => {
    counter('received');
    if (!result) {
        errors.noContent.push(ID);
        throw new Error('服务器返回数据为空（通常代表该ID念灵不存在）');
    }
    return result;
})
    .then(html => new Promise((resolve, reject) => {
    const parser = new htmlparser2.Parser(new htmlparser2.DomHandler((err, dom) => {
        if (err) {
            reject(err);
        }
        resolve(dom);
    }));
    parser.write(html);
    parser.done();
}))
    .then(dom => dfs(dom, elem => elem.attribs.id === 'jobs'))
    .then(box => [
    ID,
    dfs(box.children, elem => elem.attribs.class === 'bold' && elem.parent.attribs.class === 'headtitle')
        .children[0].data,
    getValueByAttributeName(box, '稀有度').children
        .reduce((prev, curr) => prev + (curr.type === 'tag' && curr.attribs.class === 'level_solid'), 0),
    getValueByAttributeName(box, '属性').children[0].data,
    getValueByAttributeName(box, '类型').children[0].data,
    getValueByAttributeName(box, '念力值').children[0].data | 0,
    getValueByAttributeName(box, 'MinHP').children[0].data | 0,
    getValueByAttributeName(box, 'MaxHP').children[0].data | 0,
    getValueByAttributeName(box, 'MinATK').children[0].data | 0,
    getValueByAttributeName(box, 'MaxATK').children[0].data | 0,
    getValueByAttributeName(box, 'MinHeal').children[0].data | 0,
    getValueByAttributeName(box, 'MaxHeal').children[0].data | 0,
    getValueByAttributeName(box, 'MaxLV').children[0].data | 0,
    getValueByAttributeName(box, '技能名称').children[0].data,
    getValueByAttributeName(box, '技能说明').children[0].data.trim(),
    getValueByAttributeName(box, '技能初始回合数').children[0].data | 0 || '--',
    getValueByAttributeName(box, '技能Max时回合数').children[0].data | 0 || '--',
    getValueByAttributeName(box, '技能最大lv').children[0].data | 0 || '--',
    getValueByAttributeName(box, '队长技能').children[0].data,
    getValueByAttributeName(box, '队长技能说明').children[0].data.trim(),
    `${domain}/static/img/pics/big${padLeft(String(ID), '0', 4)}.png`,
    `${domain}/static/img/icons/face${padLeft(String(ID), '0', 4)}.png`
])
    .then(result => {
    counter('parsed');
    return result;
})
    .then(result => {
    const imagePath = `images/big${padLeft(String(ID), '0', 4)}.png`;
    if (!fs.existsSync(imagePath)) {
        return rp(result[22], { encoding: null })
            .then(buffer => new Promise(resolve => fs.writeFile(imagePath, buffer, () => resolve(result))));
    }
    else {
        return result;
    }
})
    .catch(err => logError(`获取念灵 ${ID} 信息失败`, err))))
    .then(result => result.filter(record => record != null))
    .then(result => {
    console.log(`\n\n成功获取到${result.length}条数据，失败${storage.total - storage.received}个，${storage.received - storage.parsed}个请求未返回数据。`);
    console.log(`请求失败的念灵：[${errors.unexpectedError.sort((a, b) => a - b).join(', ')}]`);
    console.log(`返回数据为空的念灵（通常代表该ID念灵不存在）：[${errors.noContent.sort((a, b) => a - b).join(', ')}]`);
    return result;
})
    .then(result => {
    const workbook = new xl.WorkBook();
    workbook.updateDefaultFont({
        size: 14,
        font: '微软雅黑'
    });
    const worksheet = workbook.WorkSheet('念灵图鉴');
    titles.forEach((title, columnIndex) => worksheet.Cell(1, columnIndex + 1).String(title));
    result.forEach((row, rowIndex) => {
        row.forEach((cell, columnIndex) => {
            const workCell = worksheet.Cell(rowIndex + 2, columnIndex + 1);
            if (columnIndex >= titles.length - 2) {
                workCell.Link(cell);
            }
            else {
                switch (typeof cell) {
                    case 'number':
                        workCell.Number(cell);
                        break;
                    case 'boolean':
                        workCell.Bool(cell);
                        break;
                    case 'object':
                        if (cell instanceof Date) {
                            workCell.Date(cell);
                            break;
                        }
                    default:
                        workCell.String(String(cell));
                        break;
                }
            }
        });
    });
    {
        const linkStyle = workbook.Style();
        linkStyle.Font.Color('#0077CC');
        linkStyle.Font.Underline();
        worksheet.Cell(2, titles.length - 1, result.length + 1, titles.length).Style(linkStyle);
        worksheet.Cell(1, 1, 1, titles.length).Format.Font.Bold();
        worksheet.Cell(1, 1, result.length + 1, titles.length).Format.Font.Alignment.Horizontal('center');
    }
    worksheet.printTitles({
        rows: { begin: 1, end: result.length + 1 },
        columns: { begin: 1, end: titles.length + 1 }
    });
    worksheet.Row(1).Filter(1, titles.length - 2);
    worksheet.Row(2).Freeze();
    workbook.write('killing-city.xlsx');
})
    .then(() => console.log('\nkilling-city.xlsx：文件成功生成'))
    .catch(err => console.error('\nFATAL：生成文件失败', err));
//# sourceMappingURL=index.js.map