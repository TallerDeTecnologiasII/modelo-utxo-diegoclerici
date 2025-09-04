# Documentación - Modelo UTXO

## Enfoque Implementación
Para la implementación, decidí ir haciendo las verificaciones por separado para mantener un orden y que se vea un codigo mas limpio.

1. **Validación de Existencia de UTXO**
   - Itero sobre todos los inputs, para cada uno obtengo su UTXO, si es null(no existe) lanza el error adecuado.
2. **Validación de Balance**
   - Verifico que la suma de los montos de outputs sea igual a la suma de los montos de los UTXO obtenidos con inputs.
    

3. **Validación de Firmas Criptográficas**
   - Creo datos de transaccion con la funcion createTransactionDataForSigning_ dada.
   - Para cada input de la transaccion verifico la firma con verify de './utils/crypto'.

4. **Prevención de Doble Gasto**
   - Recorro los inputs, si el utxo no esta en el conjunto lo agrego, si ya esta en el conjunto, significa que hay duplicados (tambien se puede hacer con un doble for).

5. **Validación de Edge Cases**
   - Para cada output de la transacción se verifica que su monto sea positivo o cero.

## Desafíos
Sobre todo al principio me costó entender el contexto de la función: como empezar, que funciones usar y como lanzar los errores.

### Referencias
- Uso de Sugerencias de Copilot intentando usarlo lo menos posible, cuando ya tenía la idea clara. 