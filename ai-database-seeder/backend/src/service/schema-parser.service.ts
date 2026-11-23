import { parse } from "pgsql-ast-parser";

const schemaSql = `
    CREATE TABLE users(
        id UUID PRIMARY KEY,
        name VARCHAR(100)
    );
    CREATE TABLE orders (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        total INTEGER
    );
`;

// const ast = parse(schemaSql);

const ast = parse(schemaSql);

const ordersTable = ast.find((statement) => statement.name.name === "orders");

const findReferences = ordersTable.columns.filter((item) =>
  item.constraints?.some((constraint) => constraint.type === "reference"),
);
console.log(findReferences);
const reference = findReferences[0].constraints.find(
  (constraint) => constraint.type === "reference",
);

console.log(reference);
const obj = {
  column: findReferences[0].name.name,
  referencedTable: reference.foreignTable.name,
  referencedColumn: reference.foreignColumns[0].name,
};
