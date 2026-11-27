import crypto from "node:crypto";

const metadata = {
  order_items: {
    tableName: "order_items",
    column: [
      {
        columnName: "id",
        dataType: "uuid",
        constraint: { primaryKey: true, unique: true, notNull: true },
      },
      {
        columnName: "order_id",
        dataType: "uuid",
        constraint: { primaryKey: false, unique: false, notNull: true },
      },
      {
        columnName: "product_id",
        dataType: "uuid",
        constraint: { primaryKey: false, unique: true, notNull: true },
      },
      {
        columnName: "quantity",
        dataType: "integer",
        constraint: { primaryKey: false, unique: false, notNull: true },
      },
    ],
    primaryKey: ["id"],
    foreignKeys: [
      {
        columns: ["order_id"],
        referencedTable: "orders",
        referencedColumns: ["id"],
      },
      {
        columns: ["product_id"],
        referencedTable: "products",
        referencedColumns: ["id"],
      },
    ],
  },
  users: {
    tableName: "users",
    column: [
      {
        columnName: "id",
        dataType: "uuid",
        constraint: { primaryKey: true, unique: true, notNull: true },
      },
      {
        columnName: "name",
        dataType: "varchar",
        constraint: { primaryKey: false, unique: false, notNull: true },
      },
    ],
    primaryKey: ["id"],
    foreignKeys: [],
  },
  products: {
    tableName: "products",
    column: [
      {
        columnName: "id",
        dataType: "uuid",
        constraint: { primaryKey: true, unique: true, notNull: true },
      },
      {
        columnName: "name",
        dataType: "varchar",
        constraint: { primaryKey: false, unique: false, notNull: true },
      },
    ],
    primaryKey: ["id"],
    foreignKeys: [],
  },
  orders: {
    tableName: "orders",
    column: [
      {
        columnName: "id",
        dataType: "uuid",
        constraint: { primaryKey: true, unique: true, notNull: true },
      },
      {
        columnName: "user_id",
        dataType: "uuid",
        constraint: { primaryKey: false, unique: false, notNull: false },
      },
      {
        columnName: "total",
        dataType: "integer",
        constraint: { primaryKey: false, unique: false, notNull: true },
      },
    ],
    primaryKey: ["id"],
    foreignKeys: [
      {
        columns: ["user_id"],
        referencedTable: "users",
        referencedColumns: ["id"],
      },
    ],
  },
};

// const column = table.primaryKey.map(
//   (col) => table.column.find((colName) => colName.columnName === col)?.dataType,
// );

const ordered = ["users", "products", "orders", "order_items"];

const dataTypMetaData = ordered.reduce((acc, tableName) => {
  const table = metadata[tableName];

  acc[tableName] = {};

  table.primaryKey.forEach((pk) => {
    const column = table.column.find((col) => col.columnName === pk);

    acc[tableName][pk] = column.dataType;
  });

  return acc;
}, {});

console.dir(dataTypMetaData, { depth: null });

const generatedPkey = ordered.reduce((acc, tableName) => {
  const table = dataTypMetaData[tableName];
  const rowCount = 3;

  acc[tableName] = {};

  for (const [columnName, dataType] of Object.entries(table)) {
    if (dataType === "uuid") {
      acc[tableName][columnName] = Array.from({ length: rowCount }, () =>
        crypto.randomUUID(),
      );
    }
  }

  return acc;
}, {});

console.log(generatedPkey);

// console.log(dataTypMetaData["users"].id);

// console.log(Object.entries(dataTypMetaData));
