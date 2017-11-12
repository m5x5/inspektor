export default function simpleContentType(str) {
  return str.replace(/;.*$/, '');
}
