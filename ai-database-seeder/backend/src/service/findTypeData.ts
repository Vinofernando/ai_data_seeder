import { parse } from "pgsql-ast-parser";

const schemaSql = `
-- Table-level FK
CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    product_id UUID UNIQUE NOT NULL,
    quantity INTEGER NOT NULL,

    CONSTRAINT fk_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id),

    CONSTRAINT fk_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
);
  CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Column-level FK
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    total INTEGER NOT NULL
);


`;

const schemSql2 = `
  CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL
);
`;
const table = parse(schemaSql);
const table2 = parse(schemSql2);

const findTypeData = table.reduce((acc, curr) => {
  if (!acc[curr.name.name]) {
    acc[curr.name.name] = {
      tableName: curr.name.name,
      column: [],
      primaryKey: [],
      foreignKeys: [],
    };
  }

  curr.columns.forEach((col) => {
    const constraints = col.constraints ?? [];
    acc[curr.name.name].column.push({
      columnName: col.name.name,
      dataType: col.dataType.name,
      constraint: {
        primaryKey: constraints.some((cons) => cons.type === "primary key"),
        unique: constraints.some(
          (cons) => cons.type === "unique" || cons.type === "primary key",
        ),
        notNull: constraints.some(
          (cons) => cons.type === "not null" || cons.type === "primary key",
        ),
      },
    });
    col.constraints.forEach((cons) => {
      if (cons.type === "primary key") {
        acc[curr.name.name].primaryKey.push(col.name.name);
      }
      if (cons.type === "reference") {
        acc[curr.name.name].foreignKeys.push({
          columns: [col.name.name],
          referencedTable: cons.foreignTable.name,
          referencedColumns: [cons.foreignColumns[0].name],
        });
      }
    });
  });

  if (
    curr.constraints?.some((constraint) => constraint.type === "foreign key")
  ) {
    curr.constraints.forEach((col) => {
      acc[curr.name.name].foreignKeys.push({
        columns: [col.localColumns[0].name],
        referencedTable: col.foreignTable.name,
        referencedColumns: [col.foreignColumns[0].name],
      });
    });
  }
  return acc;
}, {});
// console.dir(table, { depth: null });
console.dir(findTypeData, { depth: null });
