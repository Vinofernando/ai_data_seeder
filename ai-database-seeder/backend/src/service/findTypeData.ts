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

const table = parse(schemaSql);

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
    col.constraints?.some((cons) => {
      if (cons.type === "primary key") {
        acc[curr.name.name].primaryKey.push(col.name.name);
      }
      acc[curr.name.name].column.push({
        columnName: col.name.name,
        dataType: col.dataType.name,
        constraint: {
          primaryKey: cons.type === "primary key" ? true : false,
          unique:
            cons.type === "unique" || cons.type === "primary key"
              ? true
              : false,
          notNull:
            cons.type === "not null" || cons.type === "primary key"
              ? true
              : false,
        },
      });

      if (curr.constraints?.some((col) => col.type === "foreign key")) {
        acc[curr.name.name].foreignKeys.push({
          columns: [col.localColumns[0].name],
          referencedTable: col.foreignTable.name,
          foreignColum: [col.foreignColumns[0].name],
        });
      }

      if (
        col?.some((constraints) =>
          constraints?.some((reference) => reference.type === "reference"),
        )
      ) {
        col.contraints?.some((refrences) => {
          acc[curr.name.name].foreignKeys.push({
            columns: [refrences.type],
            referencedTable: refrences.foreignTable.name,
            foreignColum: [refrences.foreignColumns[0].name],
          });
        });
      }
    });
  });

  return acc;
}, {});
// console.dir(table, { depth: null });
console.dir(findTypeData, { depth: null });
