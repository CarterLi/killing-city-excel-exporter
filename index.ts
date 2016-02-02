'use strict';

import htmlparser2 = require('htmlparser2');
import fetch = require('node-fetch');
import excelExport = require('excel-export');
import fs = require('fs');

const domain = 'http://xmdswiki.opd2c.com';

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
const columns = [
  '大插图', '小插图', '名称', '稀有度', 'ID', '属性', '类型', '念力值', 'MinHP', 'MaxHP', 'MinATK',
  'MinHeal', 'MaxHeal', 'MaxLV', '技能名称', '技能说明', '技能初始回合数',
  '技能Max时回合数', '技能最大lv', '队长技能', '队长技能说明', '进化后念灵名', '进化前念灵ID'
];

Promise.all(new Array(10).fill(null)
  .map((_, index) => fetch(`${domain}/index.php?r=cards%2Fdetail&roleid=${index + 1}`)
    .then(result => result.text())
    .then(result => {
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
      getValueByAttributeName(box, '念力值').children[0].data,
      getValueByAttributeName(box, 'MinHP').children[0].data,
      getValueByAttributeName(box, 'MaxHP').children[0].data,
      getValueByAttributeName(box, 'MinATK').children[0].data,
      getValueByAttributeName(box, 'MinHeal').children[0].data,
      getValueByAttributeName(box, 'MaxHeal').children[0].data,
      getValueByAttributeName(box, 'MaxLV').children[0].data,
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
      return result;
    })
    .catch(err => console.log(err.stack))
  )
)
.then(result => { console.log(`成功获取到${result.length}条数据`); return result; })
.then(result => excelExport.execute({
  cols: columns.map(caption => ({ caption, type: 'string' })),
  rows: result
}))
.then(content => new Promise((resolve, reject) => {
  fs.writeFile('killing-city.xlsx', content, 'binary', err => {
    if (err) reject(err);
    resolve();
  })
}))
.then(() => console.log('killing-city.xlsx：文件成功生成'))
.catch(err => console.error(err));
