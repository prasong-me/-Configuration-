const SEARCH_FIELDS = ["id","name","provider","protocol","role","endpoint","target","description","tags"];

function normalizeText(value) { return String(value ?? "").trim().toLocaleLowerCase(); }

function tokenize(value) {
  return normalizeText(value).split(/[^\p{L}\p{N}._:/-]+/u).map(x=>x.trim()).filter(Boolean);
}

function collectFields(item) {
  const fields=[];
  for (const field of SEARCH_FIELDS) {
    const value=item?.[field];
    if (Array.isArray(value)) fields.push(...value);
    else if (value!==undefined && value!==null) fields.push(value);
  }
  if (Array.isArray(item?.servers)) fields.push(...item.servers);
  if (item?.capabilities && typeof item.capabilities==="object") fields.push(...Object.keys(item.capabilities));
  return fields;
}

function scoreItem(item, tokens) {
  if (!tokens.length) return 0;
  const values=collectFields(item).map(normalizeText);
  const searchable=values.join(" ");
  let score=0;
  for (const token of tokens) {
    if (normalizeText(item?.id)===token) score+=100;
    else if (normalizeText(item?.name)===token) score+=90;
    else if (normalizeText(item?.provider)===token) score+=80;
    else if (values.some(value=>value===token)) score+=60;
    else if (searchable.includes(token)) score+=20;
    else return null;
  }
  return score;
}

export function searchRecords(records, query, options={}) {
  const source=Array.isArray(records)?records:[];
  const tokens=[...new Set(tokenize(query))];
  const scored=source.map((item,index)=>({item,index,score:scoreItem(item,tokens)}))
    .filter(x=>x.score!==null)
    .sort((a,b)=>b.score-a.score || a.index-b.index);
  const limit=Number.isInteger(options.limit)&&options.limit>=0 ? options.limit : scored.length;
  return scored.slice(0,limit).map(({item,score})=>({item,score}));
}

export function buildSearchIndex(records) {
  const source=Array.isArray(records)?records:[];
  return Object.freeze(source.map((item,index)=>Object.freeze({
    index,
    id:typeof item?.id==="string" ? item.id : `record-${index+1}`,
    tokens:[...new Set(tokenize(collectFields(item).join(" ")))],
    item
  })));
}

export const SearchContract=Object.freeze({
  version:"1.0",
  semantics:"AND",
  ordering:"score-desc,index-asc",
  unsupportedInference:"none"
});
