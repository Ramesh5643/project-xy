import { Pool } from "pg";
import { parse } from "pg-connection-string";

let pool;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "No database connection string was provided. Set DATABASE_URL to a PostgreSQL connection string.",
    );
  }

  const parsed = parse(connectionString);
  pool = new Pool({
    ...parsed,
    ssl: parsed.ssl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return pool;
}

async function runQuery(query, values, client = null) {
  const targetClient = client ?? getPool();
  if (typeof query === "string") {
    const result = await targetClient.query(query, values ?? []);
    return result.rows;
  }

  const result = await targetClient.query(query, values ?? []);
  return result.rows;
}

function createQueryDescriptor(template, values) {
  return {
    __sqlQuery: true,
    template,
    values,
    then(onFulfilled, onRejected) {
      return runQuery(template, values).then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return runQuery(template, values).catch(onRejected);
    },
    finally(onFinally) {
      return runQuery(template, values).finally(onFinally);
    },
  };
}

const NullishQueryFunction = () => {
  throw new Error(
    "No database connection string was provided. Set DATABASE_URL to a PostgreSQL connection string.",
  );
};
NullishQueryFunction.transaction = () => {
  throw new Error(
    "No database connection string was provided. Set DATABASE_URL to a PostgreSQL connection string.",
  );
};

const sql = new Proxy(NullishQueryFunction, {
  apply(_target, _thisArg, args) {
    const template = args[0];
    if (typeof template === "string") {
      const values = Array.isArray(args[1]) ? args[1] : args.slice(1);
      return createQueryDescriptor(template, values);
    }
    if (Array.isArray(template)) {
      const values = args.slice(1);
      const query = template.reduce((acc, part, index) => {
        acc += part;
        if (index < values.length) {
          acc += `$${index + 1}`;
        }
        return acc;
      }, "");
      return createQueryDescriptor(query, values);
    }
    return createQueryDescriptor(template, []);
  },
  get(target, prop) {
    if (prop === "transaction") {
      return async (queries) => {
        const client = await getPool().connect();
        try {
          await client.query("BEGIN");
          const results = [];
          for (const query of queries) {
            if (query && query.__sqlQuery) {
              const rows = await runQuery(query.template, query.values, client);
              results.push(rows);
            } else {
              results.push(query);
            }
          }
          await client.query("COMMIT");
          return results;
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      };
    }

    return target[prop];
  },
});

export default sql;
