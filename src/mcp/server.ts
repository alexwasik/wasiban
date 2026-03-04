import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
} from '../lib/db/boards';
import {
  getColumnsByBoardId,
  createColumn,
  updateColumn,
  deleteColumn,
} from '../lib/db/columns';
import {
  getCardById,
  createCard,
  updateCard,
  moveCard,
  deleteCard,
  filterCards,
} from '../lib/db/cards';
import {
  getCommentsByCardId,
  createComment,
  deleteComment,
} from '../lib/db/comments';
import {
  getBoardLabels,
  createLabel,
  deleteLabel,
  addLabelToCard,
  removeLabelFromCard,
} from '../lib/db/labels';

const server = new Server(
  {
    name: 'wasiban-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'boards://list',
        name: 'List of boards',
        mimeType: 'application/json',
        description: 'Returns an overview of all boards.',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'boards://list') {
    const boards = await getBoards();
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'application/json',
          text: JSON.stringify(boards, null, 2),
        },
      ],
    };
  }

  const boardMatch = request.params.uri.match(/^board:\/\/([^\/]+)$/);
  if (boardMatch) {
    const boardId = boardMatch[1];
    const board = await getBoardById(boardId);
    if (!board) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Board ${boardId} not found`
      );
    }
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'application/json',
          text: JSON.stringify(board, null, 2),
        },
      ],
    };
  }

  throw new McpError(
    ErrorCode.InvalidRequest,
    `Unsupported resource URI: ${request.params.uri}`
  );
});

// Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_boards',
        description: 'List all Kanban boards',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_board',
        description: 'Get a board by ID including all its columns and cards',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
      {
        name: 'create_board',
        description: 'Create a new Kanban board',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            color: { type: 'string' },
          },
          required: ['name'],
        },
      },
      {
        name: 'update_board',
        description: 'Update an existing Kanban board',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            color: { type: 'string' },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_board',
        description: 'Delete an existing Kanban board',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
      {
        name: 'create_column',
        description: 'Create a new column in a board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: { type: 'string' },
            name: { type: 'string' },
            position: { type: 'number' },
          },
          required: ['boardId', 'name', 'position'],
        },
      },
      {
        name: 'move_card',
        description: 'Move a card to a different column or position',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: { type: 'string' },
            newColumnId: { type: 'string' },
            newPosition: { type: 'number' },
          },
          required: ['cardId', 'newColumnId', 'newPosition'],
        },
      },
      {
        name: 'create_card',
        description: 'Create a new card',
        inputSchema: {
          type: 'object',
          properties: {
            columnId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            position: { type: 'number' },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'highest'],
              description: 'Priority level of the card',
            },
          },
          required: ['columnId', 'title', 'position'],
        },
      },
      {
        name: 'update_card',
        description: 'Update an existing card',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            statusUpdate: {
              type: 'string',
              description: 'A status update or progress note for the card',
            },
            dueDate: { type: 'string', description: 'ISO 8601 date string' },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'highest'],
              description: 'Priority level of the card',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'filter_cards_by_priority',
        description:
          'Filter cards by priority, optionally scoped to a board or column',
        inputSchema: {
          type: 'object',
          properties: {
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'highest'],
              description: 'Priority to filter by',
            },
            boardId: {
              type: 'string',
              description: 'Scope results to a specific board',
            },
            columnId: {
              type: 'string',
              description: 'Scope results to a specific column',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_board_labels',
        description: 'Get all labels defined for a board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: { type: 'string' },
          },
          required: ['boardId'],
        },
      },
      {
        name: 'create_label',
        description: 'Create a new label on a board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: { type: 'string' },
            name: { type: 'string' },
            color: {
              type: 'string',
              description: 'Hex color string e.g. #ff4d4f',
            },
          },
          required: ['boardId', 'name', 'color'],
        },
      },
      {
        name: 'delete_label',
        description: 'Delete a label from a board',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
      {
        name: 'add_label_to_card',
        description: 'Apply a label to a card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: { type: 'string' },
            labelId: { type: 'string' },
          },
          required: ['cardId', 'labelId'],
        },
      },
      {
        name: 'remove_label_from_card',
        description: 'Remove a label from a card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: { type: 'string' },
            labelId: { type: 'string' },
          },
          required: ['cardId', 'labelId'],
        },
      },
      {
        name: 'get_comments',
        description: 'Get all comments for a card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: { type: 'string' },
          },
          required: ['cardId'],
        },
      },
      {
        name: 'create_comment',
        description: 'Add a comment to a card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: { type: 'string' },
            content: {
              type: 'string',
              description: 'Markdown content of the comment',
            },
          },
          required: ['cardId', 'content'],
        },
      },
      {
        name: 'delete_comment',
        description: 'Delete a comment by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    let result: any;

    switch (name) {
      case 'list_boards':
        result = await getBoards();
        break;
      case 'get_board':
        result = await getBoardById((args as any).id);
        break;
      case 'create_board':
        result = await createBoard(args as any);
        break;
      case 'update_board':
        result = await updateBoard((args as any).id, args as any);
        break;
      case 'delete_board':
        result = await deleteBoard((args as any).id);
        break;
      case 'create_column':
        result = await createColumn(args as any);
        break;
      case 'move_card':
        result = await moveCard(
          (args as any).cardId,
          (args as any).newColumnId,
          (args as any).newPosition
        );
        break;
      case 'create_card':
        result = await createCard(args as any);
        break;
      case 'update_card': {
        const { id, dueDate, ...rest } = args as any;
        result = await updateCard(id, {
          ...rest,
          dueDate: dueDate ? new Date(dueDate) : undefined,
        });
        break;
      }
      case 'filter_cards_by_priority':
        result = await filterCards(args as any);
        break;
      case 'get_board_labels':
        result = await getBoardLabels((args as any).boardId);
        break;
      case 'create_label':
        result = await createLabel(args as any);
        break;
      case 'delete_label':
        result = await deleteLabel((args as any).id);
        break;
      case 'add_label_to_card':
        result = await addLabelToCard(
          (args as any).cardId,
          (args as any).labelId
        );
        break;
      case 'remove_label_from_card':
        result = await removeLabelFromCard(
          (args as any).cardId,
          (args as any).labelId
        );
        break;
      case 'get_comments':
        result = await getCommentsByCardId((args as any).cardId);
        break;
      case 'create_comment':
        result = await createComment(args as any);
        break;
      case 'delete_comment':
        result = await deleteComment((args as any).id);
        break;
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Wasiban MCP server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
