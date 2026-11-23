import { parse } from "pgsql-ast-parser";

const schemaSql = `
-- Table-level FK
CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
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
const schemaSql2 = `
CREATE TABLE IF NOT EXISTS public."ProductImage"
(
    id text COLLATE pg_catalog."default" NOT NULL,
    "productId" text COLLATE pg_catalog."default" NOT NULL,
    url character varying(2048) COLLATE pg_catalog."default" NOT NULL,
    "isPrimary" boolean NOT NULL DEFAULT false,
    "sortOrder" integer NOT NULL DEFAULT 0,
    "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "ProductImage_pkey" PRIMARY KEY (id),
    CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId")
        REFERENCES public."Product" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public."Product"
(
    id text COLLATE pg_catalog."default" NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default" NOT NULL,
    "warrantyInfo" character varying(255) COLLATE pg_catalog."default",
    "isArchived" boolean NOT NULL DEFAULT false,
    "categoryId" text COLLATE pg_catalog."default" NOT NULL,
    "brandId" text COLLATE pg_catalog."default" NOT NULL,
    "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY (id),
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId")
        REFERENCES public."Brand" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId")
        REFERENCES public."Category" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public."Category"
(
    id text COLLATE pg_catalog."default" NOT NULL,
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    "parentId" text COLLATE pg_catalog."default",
    "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY (id),
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId")
        REFERENCES public."Category" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public."Brand"
(
    id text COLLATE pg_catalog."default" NOT NULL,
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "Brand_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."ProductVariant" (
    id text PRIMARY KEY,
    "productId" text NOT NULL,
    "variantCode" text,
    CONSTRAINT "ProductVariant_composite_fkey"
        FOREIGN KEY ("productId", "variantCode")
        REFERENCES public."Product" (id, name)
);
`;

const ast = parse(schemaSql);
const ast2 = parse(schemaSql2);

const table = ast.reduce((acc, curr) => {
  if (!acc[curr.name.name]) {
    acc[curr.name.name] = {
      tableName: curr.name.name,
      foreignKeys: [],
    };
  }

  if (
    curr.columns?.some((column) =>
      column.constraints?.some((constraint) => constraint.type === "reference"),
    )
  ) {
    curr.columns
      .filter((item) =>
        item.constraints?.some((constraint) => constraint.type === "reference"),
      )
      .forEach((column) => {
        const reference = column.constraints.find(
          (constraint) => constraint.type === "reference",
        );

        const isNotNull = column.constraints?.some(
          (item) => item.type === "not null",
        );

        const nullable = !isNotNull;
        acc[curr.name.name].foreignKeys.push({
          column: column.name.name,
          referencedTable: reference.foreignTable.name,
          referencedColumn: reference.foreignColumns[0].name,
          nullable: nullable,
        });
      });
  }

  if (
    curr.constraints?.some((constraint) => constraint.type === "foreign key")
  ) {
    curr.constraints
      .filter((item) => item.type === "foreign key")
      .forEach((item) => {
        item.localColumns.forEach((localColumn, index) => {
          const column = curr.columns.find(
            (column) => column.name.name === localColumn.name,
          );

          if (!column) {
            throw new Error(`Column ${localColumn.name} not found`);
          }

          const isNotNull = column.constraints?.some(
            (constraint) => constraint.type === "not null",
          );
          const nullable = !isNotNull;
          acc[curr.name.name].foreignKeys.push({
            column: item.localColumns[index].name,
            referencedTable: item.foreignTable.name,
            referencedColumn: item.foreignColumns[index].name,
            nullable,
          });
        });
      });
  }
  return acc;
}, {});

const depedencies = Object.entries(table).reduce(
  (acc, [tableName, tableData]) => {
    acc[tableName] = tableData.foreignKeys.map((fk) => fk.referencedTable);

    return acc;
  },
  {},
);

function topologicalSort(depedencies) {
  const queue = [];

  const uniqueDepedencies = Object.entries(depedencies).reduce(
    (acc, [table, deps]) => {
      acc[table] = [...new Set(deps)];
      return acc;
    },
    {},
  );

  const inDegree = Object.entries(uniqueDepedencies).reduce(
    (acc, [table, deps]) => {
      acc[table] = deps.length;
      return acc;
    },
    {},
  );
  Object.entries(uniqueDepedencies).forEach((item) => {
    if (item[1].length === 0) {
      queue.push(item[0]);
    }
  });

  const result = [];

  while (queue.length > 0) {
    const current = queue.shift();

    Object.entries(uniqueDepedencies).forEach(([table, deps]) => {
      if (deps.includes(current)) {
        inDegree[table] -= 1;

        if (inDegree[table] === 0) {
          queue.push(table);
        }
      }
    });
    result.push(current);
  }

  if (result.length !== Object.keys(depedencies).length) {
    throw new Error("Circular depedency detected");
  }

  return result;
}

console.dir(ast, { depth: null });
// console.dir(table, { depth: null });
// console.log(depedencies);
// console.log(topologicalSort(depedencies));
