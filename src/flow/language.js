import {
  join,
  wrap,
} from '../utilities/printing';

import { propertyDeclarations } from './codeGeneration';
import { typeNameFromGraphQLType } from './types';

import { pascalCase } from 'change-case';

export function typeDeclaration(generator, { interfaceName, noBrackets }, closure) {
  generator.printNewlineIfNeeded();
  generator.printNewline();
  generator.print(`export type ${ interfaceName } =`);
  generator.pushScope({ typeName: interfaceName });
  if (noBrackets) {
    generator.withinBlock(closure, '', '');
  } else {
    generator.withinBlock(closure, ' {|', '|}');
  }
  generator.popScope();
  generator.print(';');
}

export function propertyDeclaration(generator, {
  fieldName,
  type,
  propertyName,
  typeName,
  description,
  isArray,
  isNullable,
  inInterface,
  fragmentSpreads
}, closure, open = ' {|', close = '|}') {
  generator.printOnNewline(description && `// ${description}`);

  if (closure) {
    generator.printOnNewline(`${fieldName || propertyName}:`);
    if (isNullable) {
      generator.print(' ?');
    }
    if (isArray) {
      if (!isNullable) {
        generator.print(' ');
      }
      generator.print('Array<');
    }

    generator.pushScope({ typeName: fieldName || propertyName });

    generator.withinBlock(() => {
      closure();
    }, open, close);


    generator.popScope();

    if (isArray) {
      generator.print(' >');
    }

  } else {
    generator.printOnNewline(`${propertyName || fieldName}: ${typeName || typeNameFromGraphQLType(generator.context, type)}`);
  }
  generator.print(',');
}

export function propertySetsDeclaration(generator, property, propertySets, standalone = false) {
  const { description, fieldName, propertyName, typeName, isNullable, isArray } = property;

  generator.printOnNewline(description && `// ${description}`);
  if (!standalone) {
    generator.printOnNewline(`${propertyName || fieldName}:`);
  }

  if (isNullable) {
    generator.print(' ?');
  }

  if (isArray) {
    generator.print('Array< ');
  }

  generator.pushScope({ typeName: fieldName || propertyName });

  generator.withinBlock(() => {
    propertySets.forEach((propertySet, index, propertySets) => {
      generator.withinBlock(() => {
        propertyDeclarations(generator, propertySet);
      });
      if (index !== propertySets.length - 1) {
        generator.print(' |');
      }
    })
  }, ' (', ')');

  generator.popScope();

  if (isArray) {
    generator.print(' >');
  }

  if (!standalone) {
    generator.print(',');
  }
}
