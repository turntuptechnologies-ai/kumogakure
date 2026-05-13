import type { TemplateFn } from '../../types.js';

const body = JSON.stringify({
  data: {
    __schema: {
      queryType: { name: 'Query' },
      mutationType: { name: 'Mutation' },
      subscriptionType: null,
      types: [
        {
          kind: 'OBJECT',
          name: 'Query',
          fields: [
            {
              name: 'me',
              type: { kind: 'OBJECT', name: 'User' },
              args: [],
            },
            {
              name: 'users',
              type: { kind: 'LIST', ofType: { kind: 'OBJECT', name: 'User' } },
              args: [],
            },
          ],
        },
        {
          kind: 'OBJECT',
          name: 'Mutation',
          fields: [
            {
              name: 'login',
              type: { kind: 'SCALAR', name: 'String' },
              args: [
                { name: 'username', type: { kind: 'SCALAR', name: 'String' } },
                { name: 'password', type: { kind: 'SCALAR', name: 'String' } },
              ],
            },
          ],
        },
        {
          kind: 'OBJECT',
          name: 'User',
          fields: [
            { name: 'id', type: { kind: 'SCALAR', name: 'ID' }, args: [] },
            { name: 'email', type: { kind: 'SCALAR', name: 'String' }, args: [] },
            { name: 'name', type: { kind: 'SCALAR', name: 'String' }, args: [] },
          ],
        },
      ],
    },
  },
});

export const graphqlIntrospection: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
};
