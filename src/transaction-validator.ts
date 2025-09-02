import { Transaction, TransactionInput } from './types';
import { UTXOPoolManager } from './utxo-pool';
import { verify } from './utils/crypto';
import {
  ValidationResult,
  ValidationError,
  VALIDATION_ERRORS,
  createValidationError
} from './errors';

export class TransactionValidator {
  constructor(private utxoPool: UTXOPoolManager) { }

  /**
   * Validate a transaction
   * @param {Transaction} transaction - The transaction to validate
   * @returns {ValidationResult} The validation result
   */
  validateTransaction(transaction: Transaction): ValidationResult {
    const errors: ValidationError[] = [];

    // STUDENT ASSIGNMENT: Implement the validation logic above
    // Remove this line and implement the actual validation

    /* 
    Validacion de Existencia de UTXO. 
    Explicación:Itero sobre todos los inputs, para cada uno obtengo su UTXO, si es null(no existe) lanza el error adecuado.
    */
    for (const input of transaction.inputs) {
      const utxo = this.utxoPool.getUTXO(input.utxoId.txId, input.utxoId.outputIndex);
      if (!utxo) {
        errors.push(createValidationError(VALIDATION_ERRORS.UTXO_NOT_FOUND, `Input UTXO not found in the pool`));
      }
    }

    /*
    Validacion de Balance
    Explicación:Verifico que la suma de los montos de outputs sea igual a la suma de los montos de los UTXO obtenidos con inputs.
    */
    let totalOutputAmount = 0;
    let totalInputAmount = 0;

    for (const output of transaction.outputs) {
      totalOutputAmount += output.amount;
    }

    for (const input of transaction.inputs) {
      const utxo = this.utxoPool.getUTXO(input.utxoId.txId, input.utxoId.outputIndex);
      if (utxo) {
        totalInputAmount += utxo.amount;
      }
    }

    if (totalInputAmount !== totalOutputAmount) {
      errors.push(createValidationError(VALIDATION_ERRORS.AMOUNT_MISMATCH, `Mismatch between input and output amounts`));
    }

    /* 
    Validacion de Firma
    Explicacion: Creo datos de transaccion con la funcion createTransactionDataForSigning_ dada.
    Para cada input de la transaccion verifico la firma con verify de './utils/crypto'
    */
    const transactionData = this.createTransactionDataForSigning_(transaction);
    for (const input of transaction.inputs) {
      const isValid = verify(transactionData, input.signature, input.owner);
      if (!isValid) {
        errors.push(createValidationError(VALIDATION_ERRORS.INVALID_SIGNATURE, `Invalid signature for input`));
      }
    }

    /*
    Prevencion Doble Gasto
    Explicacion: Recorro los inputs, si el utxo no esta en el conjunto lo agrego, si ya esta en el conjunto, significa que hay duplicados (tambien se puede hacer con un doble for).
    */
    const seenInputs = new Set();
    for (const input of transaction.inputs) {
      const utxo = this.utxoPool.getUTXO(input.utxoId.txId, input.utxoId.outputIndex);
      if (utxo) {
        if (seenInputs.has(utxo.id)) {
          errors.push(createValidationError(VALIDATION_ERRORS.DOUBLE_SPENDING, `Double spending detected for input`));
        }
        seenInputs.add(utxo.id);
      }
    }
    /* 
    Rechazar si un output es de cero o negativo
    Explicación: Para cada output de la transacción se verifica que su monto sea positivo.
    */
    for (const output of transaction.outputs) {
      if (output.amount <= 0) {
        errors.push(createValidationError(VALIDATION_ERRORS.NEGATIVE_AMOUNT, `Transaction output cannot be negative`));
      }

    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a deterministic string representation of the transaction for signing
   * This excludes the signatures to prevent circular dependencies
   * @param {Transaction} transaction - The transaction to create a data for signing
   * @returns {string} The string representation of the transaction for signing
   */
  private createTransactionDataForSigning_(transaction: Transaction): string {
    const unsignedTx = {
      id: transaction.id,
      inputs: transaction.inputs.map(input => ({
        utxoId: input.utxoId,
        owner: input.owner
      })),
      outputs: transaction.outputs,
      timestamp: transaction.timestamp
    };

    return JSON.stringify(unsignedTx);
  }
}
