import { buffer } from 'stream/consumers';
import { Transaction, TransactionInput, TransactionOutput } from '../types';


function stringWithPrefix(str: string): Buffer {
  const strBuf = Buffer.from(str, 'utf-8');
  const lengthBuf = Buffer.from([strBuf.length]); 
  return Buffer.concat([lengthBuf, strBuf]);
}

function byteBuf(data: number, bytes: number): Buffer {
  const buf = Buffer.allocUnsafe(bytes);
  if (bytes === 8) {
    buf.writeBigUInt64BE(BigInt(data), 0);
  } else if (bytes === 1) {
    buf.writeUInt8(data, 0);
  }
  return buf;
}

function readStringWithPrefix(buffer: Buffer, offset: number): { str: string, newOffset: number } {
  const length = buffer.readUInt8(offset);
  const str = buffer.subarray(offset + 1, offset + 1 + length).toString('utf-8');
  return { str, newOffset: offset + 1 + length };
}

function readByteBuf(buffer: Buffer, offset: number, bytes: number): { value: number, newOffset: number } {
  let value: number;
  if (bytes === 8) {
    value = Number(buffer.readBigUInt64BE(offset));
  } else if (bytes === 1) {
    value = buffer.readUInt8(offset);
  } else {
    throw new Error(`Unsupported byte size: ${bytes}`);
  }
  return { value, newOffset: offset + bytes };
}
/**
 * Encode a transaction to binary format for space-efficient storage
 * @param {Transaction} transaction - The transaction to encode
 * @returns {Buffer} The binary representation
 */
export function encodeTransaction(transaction: Transaction): Buffer {
  // BONUS CHALLENGE: Implement binary encoding for transactions
  // This should create a compact binary representation instead of JSON

  // Suggested approach:
  // 1. Use fixed-size fields where possible (e.g., 8 bytes for amounts, timestamps)
  // 2. Use length-prefixed strings for variable-length data (id, signatures, public keys)
  // 3. Use compact representations for counts (e.g., 1 byte for number of inputs/outputs if < 256)

  const buffers: Buffer[] = [];
  buffers.push(stringWithPrefix(transaction.id)); 
  buffers.push(byteBuf(transaction.timestamp, 8)); 
  
  buffers.push(byteBuf(transaction.inputs.length, 1)); 
  buffers.push(byteBuf(transaction.outputs.length, 1)); 

  for(const input of transaction.inputs) {
    buffers.push(stringWithPrefix(input.utxoId.txId)); 

    buffers.push(byteBuf(input.utxoId.outputIndex, 1)); 
    buffers.push(stringWithPrefix(input.owner)); 
    buffers.push(stringWithPrefix(input.signature)); 
  }
  for(const output of transaction.outputs) {
    buffers.push(byteBuf(output.amount, 8)); 
    buffers.push(stringWithPrefix(output.recipient)); 
  }
 
  return Buffer.concat(buffers);
}

/**
 * Decode a transaction from binary format
 * @param {Buffer} buffer - The binary data to decode
 * @returns {Transaction} The reconstructed transaction object
 */
export function decodeTransaction(buffer: Buffer): Transaction {
  // BONUS CHALLENGE: Implement binary decoding for transactions
  // This should reconstruct a Transaction object from the binary representation

  let offset = 0;

  const { str: id, newOffset: offset1 } = readStringWithPrefix(buffer, offset);
  offset = offset1;
  
  const { value: timestamp, newOffset: offset2 } = readByteBuf(buffer, offset, 8);
  offset = offset2;

    const { value: inputsLength, newOffset: offset3 } = readByteBuf(buffer, offset, 1);
  offset = offset3;
  
  const { value: outputsLength, newOffset: offset4 } = readByteBuf(buffer, offset, 1);
  offset = offset4;

  const inputs: TransactionInput[] = [];
  for (let i = 0; i < inputsLength; i++) {

    const { str: txId, newOffset: o1 } = readStringWithPrefix(buffer, offset);
    offset = o1;
    const { value: outputIndex, newOffset: o2 } = readByteBuf(buffer, offset, 1);
    offset = o2;
    const utxoId = { txId, outputIndex };

    const { str: owner, newOffset: o3 } = readStringWithPrefix(buffer, offset);
    offset = o3;
    const { str: signature, newOffset: o4 } = readStringWithPrefix(buffer, offset);
    offset = o4;

    inputs.push({utxoId,owner,signature});
  }

  const outputs: TransactionOutput[] = [];
  for (let i = 0; i < outputsLength; i++) {
    const { value: amount, newOffset: o1 } = readByteBuf(buffer, offset, 8);
    offset = o1;
    const { str: recipient, newOffset: o2 } = readStringWithPrefix(buffer, offset);
    offset = o2;
    outputs.push({ amount, recipient });

  }
  const transaction: Transaction = { id, timestamp, inputs, outputs };
  return transaction;
}
// Prueba rápida para comparar tamaños de JSON vs binario
function sizeComparison(transaction: Transaction): void {
  const jsonString = JSON.stringify(transaction);
  console.log("JSON: " + Buffer.byteLength(jsonString));

  const binaryBuffer = encodeTransaction(transaction);
  console.log("Binary: " + Buffer.byteLength(binaryBuffer));
}
sizeComparison({
  id: 'tx123',
  timestamp: 1625247600,
  inputs: [
    {
      utxoId: { txId: 'utxo1', outputIndex: 0 },
      owner: 'Alice',
      signature: 'sig1'
    }
  ],
  outputs: [
    {
      amount: 1000,
      recipient: 'Bob'
    }
  ]
});

/**
 * Compare encoding efficiency between JSON and binary representations
 * @param {Transaction} transaction - The transaction to analyze
 * @returns {object} Size comparison and savings information
 */
export function getEncodingEfficiency(transaction: Transaction): {
  jsonSize: number;
  binarySize: number;
  savings: string;
} {
  const jsonSize = Buffer.from(JSON.stringify(transaction)).length;
  try {
    const binarySize = encodeTransaction(transaction).length;
    const savingsPercent = (((jsonSize - binarySize) / jsonSize) * 100).toFixed(1);
    return {
      jsonSize,
      binarySize,
      savings: `${savingsPercent}%`
    };
  } catch {
    return {
      jsonSize,
      binarySize: -1,
      savings: 'Not implemented'
    };
  }
}
