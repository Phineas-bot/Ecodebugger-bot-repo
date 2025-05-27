import * as parser from '@babel/parser';
import traverse from '@babel/traverse';

export function parseCodeToAST(code: string) {
    return parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
    });
}

export { traverse };