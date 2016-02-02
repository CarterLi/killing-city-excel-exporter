'use strict';

import htmlparser2 = require('htmlparser2');
import fetch = require('node-fetch');
import excelExport = require('excel-export');
import fs = require('fs');

const domain = 'http://xmdswiki.opd2c.com';

const storage = {
  total: 1200,
  received: 0,
  parsed: 0
};

function dfs(dom: any[], condition: (elem) => boolean): any {
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

function getValueByAttributeName(box: any, attribute: string) {
  return dfs(box.children, elem => elem.name === 'span'
      && elem.children[0].data === attribute).next.next;
}

function padLeft(str: string, char: string, len: number): string {
  return char.repeat(len - str.length) + str;
}

function counter(key) {
  ++storage[key];
  process.stdout.write(`Total: ${storage.total}; Received: ${storage.received}; Parsed: ${storage.parsed}; Percentage: ${(storage.received / storage.total * 100).toFixed(2)}%\u001b[0G`);
};

function logError(msg, detail) {
  // console.log(msg, detail);
}

Promise.all(new Array(storage.total).fill(null)
  .map((_, index) => fetch(`${domain}/index.php?r=cards%2Fdetail&roleid=${index + 1}`)
    .then(result => result.text())
    .then(result => {
      counter('received');
      if (!result) throw new Error('Empty content');
      return result;
    })
    .then(html => new Promise<any[]>((resolve, reject) => {
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
      `${domain}/static/img/pics/big${padLeft(String(index + 1), '0', 4)}.png`,
      `${domain}/static/img/icons/face${padLeft(String(index + 1), '0', 4)}.png`,
      dfs(box.children, elem => elem.attribs.class === 'bold' && elem.parent.attribs.class === 'headtitle')
          .children[0].data,
      getValueByAttributeName(box, '稀有度').children
          .reduce((prev, curr) => prev + (curr.type === 'tag' && curr.attribs.class === 'level_solid'), 0),
      index + 1, // getValueByAttributeName(box, 'ID').children[0].data,
      getValueByAttributeName(box, '属性').children[0].data,
      getValueByAttributeName(box, '类型').children[0].data,
      getValueByAttributeName(box, '念力值').children[0].data | 0,
      getValueByAttributeName(box, 'MinHP').children[0].data | 0,
      getValueByAttributeName(box, 'MaxHP').children[0].data | 0,
      getValueByAttributeName(box, 'MinATK').children[0].data | 0,
      getValueByAttributeName(box, 'MinHeal').children[0].data | 0,
      getValueByAttributeName(box, 'MaxHeal').children[0].data | 0,
      getValueByAttributeName(box, 'MaxLV').children[0].data | 0,
      getValueByAttributeName(box, '技能名称').children[0].data,
      getValueByAttributeName(box, '技能说明').children[0].data.trim(),
      getValueByAttributeName(box, '技能初始回合数').children[0].data,
      getValueByAttributeName(box, '技能Max时回合数').children[0].data,
      getValueByAttributeName(box, '技能最大lv').children[0].data,
      getValueByAttributeName(box, '队长技能').children[0].data,
      getValueByAttributeName(box, '队长技能说明').children[0].data.trim(),
      '', // getValueByAttributeName(box, '队长技能说明').children[0].children[0].data,
      '', // getValueByAttributeName(box, '进化前念灵ID').children[0].data
    ])
    .then(result => {
      counter('parsed');
      return result;
    })
    .catch(err => logError(`获取念灵 ${index + 1} 信息失败`, err.stack))
  )
)
.then(result => result.filter(record => record != null))
.then(result => {
  console.log(`\n成功获取到${result.length}条数据，失败${storage.total-storage.received}个，${storage.received-storage.parsed}个请求未返回数据`);
  return result;
})
.then(result => excelExport.execute({
  cols: [
    { caption: '大插图', type: 'string' },
    { caption: '小插图', type: 'string' },
    { caption: '名称', type: 'string' },
    { caption: '稀有度', type: 'number' },
    { caption: 'ID', type: 'number' },
    { caption: '属性', type: 'string' },
    { caption: '类型', type: 'string' },
    { caption: '念力值', type: 'number' },
    { caption: 'MinHP', type: 'number' },
    { caption: 'MaxHP', type: 'number' },
    { caption: 'MinATK', type: 'number' },
    { caption: 'MinHeal', type: 'number' },
    { caption: 'MaxHeal', type: 'number' },
    { caption: 'MaxLV', type: 'number' },
    { caption: '技能名称', type: 'string' },
    { caption: '技能说明', type: 'string' },
    { caption: '技能初始回合数', type: 'string' },
    { caption: '技能Max时回合数', type: 'string' },
    { caption: '技能最大lv', type: 'string' },
    { caption: '队长技能', type: 'string' },
    { caption: '队长技能说明', type: 'string' },
    { caption: '进化后念灵名', type: 'string' },
    { caption: '进化前念灵ID', type: 'string' }
  ],
  rows: result
}))
.then(content => new Promise((resolve, reject) => {
  fs.writeFile('killing-city.xlsx', content, 'binary', err => {
    if (err) reject(err);
    resolve();
  })
}))
.then(() => console.log('killing-city.xlsx：文件成功生成'))
.catch(err => logError('生成文件失败', err));
