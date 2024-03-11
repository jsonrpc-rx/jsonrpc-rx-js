export function throwParseError() {
  JSON.parse('{"a":1');
}
