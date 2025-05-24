import * as htmlparser2 from 'htmlparser2';
import getDisplayTime from './getDisplayTime';

const he = require('he');

const parseRSS = (xml: string, source: { name: string; icon: string }) => {
  let items: any = [];
  let item: any;

  let initem = false;
  let intitle = false;
  let inlink = false;
  let indate = false;
  let indesc = false;
  let inmedia = false;
  let descBuff = '';
  let titleBuff = '';
  const parser = new htmlparser2.Parser(
    {
      onopentag(tagname, attributes) {
        if (tagname === 'item' || tagname === 'entry') {
          item = {
            id: (Math.random() + 1).toString(36).substring(7),
            source: source.name,
            categoryIcon: source.icon,
          };
          initem = true;
        }
        if (tagname === 'title') {
          titleBuff = '';
          intitle = true;
        }
        if (
          tagname === 'pubDate' ||
          tagname === 'dc:date' ||
          tagname === 'updated'
        ) {
          indate = true;
        }
        if (
          tagname === 'description' ||
          tagname === 'summary' ||
          tagname.includes('content')
        ) {
          indesc = true;
          descBuff = '';
        }
        if (tagname === 'link') {
          if (initem && item && !item.url && !!attributes.href) {
            item.url = attributes.href.trim();
          } else {
            inlink = true;
          }
        }
        if (
          tagname === 'media:content' ||
          tagname === 'media:thumbnail' ||
          tagname === 'image'
        ) {
          if (initem && item && !item.imageUrl && attributes.url) {
            item.imageUrl = attributes.url;
          } else {
            inmedia = true;
          }
        }
      },
      ontext(text) {
        if (initem && intitle) {
          titleBuff += text;
        }
        if (initem && inlink) {
          if (!item.url && !!text) {
            item.url = text.trim();
          }
        }
        if (initem && indate) {
          item.pubDate = he.decode(text.trim());
          item.datePublished = new Date(Date.parse(item.pubDate));
          item.displayTime = getDisplayTime(item.datePublished);
        }
        if (initem && inmedia) {
          item.imageUrl = text.trim();
        }
        if (initem && indesc) {
          descBuff += text;
        }
      },
      onclosetag(tagname) {
        if (tagname === 'item' || tagname === 'entry') {
          initem = false;
          items.push(item);
        }
        if (intitle && tagname === 'title') {
          if (initem) {
            item.name = he.decode(titleBuff.trim());
          }
          intitle = false;
        }
        if (tagname === 'link') {
          inlink = false;
        }
        if (
          tagname === 'pubDate' ||
          tagname === 'dc:date' ||
          tagname === 'updated'
        ) {
          indate = false;
        }
        if (
          tagname === 'description' ||
          tagname === 'summary' ||
          tagname.includes('content')
        ) {
          indesc = false;
          if (initem && item) {
            if (
              !item.rawContent ||
              descBuff?.length > item.rawContent?.length
            ) {
              item.rawContent = descBuff
                .replaceAll(/<\s+/g, '<')
                .replaceAll(/\s+>/g, '>');
            }
          }
        }
        if (
          tagname === 'media:content' ||
          tagname === 'media:thumbnail' ||
          tagname === 'image'
        ) {
          inmedia = false;
        }
      },
    },
    { xmlMode: true }
  );
  parser.write(xml);
  parser.end();

  for (const item of items) {
    if (!item.rawContent) {
      item.rawContent = '';
    }

    let output = '';
    const parser = new htmlparser2.Parser({
      onopentag(tagname, attrs) {
        if (!item.imageUrl && tagname === 'img') {
          item.imageUrl = attrs['src'];
        }
      },
      ontext(text) {
        output += text.replaceAll('-', ' ').replaceAll('/', ' ');
      },
      onclosetag(tagname) {
        if (tagname === 'p') {
          output += '\n';
        }
      },
    });
    parser.write(item.rawContent);
    parser.end();

    if (!!output && output.length > 0) {
      item.rawContent = output;
    }

    if (item.rawContent) {
      item.content = item.rawContent
        .split(/\?|!|(?<![Mr|MR|e\.g|E\.g|E\.G])\.\s|\.\n|\n/)
        .map((el: string) => el.trim())
        .filter((el: string) => !!el && el.length > 0);
    } else {
      item.content = [];
    }
    item.rawContent = undefined;
  }

  return items;
};

export default parseRSS;
