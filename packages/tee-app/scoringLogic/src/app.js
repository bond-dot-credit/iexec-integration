import fs from 'node:fs/promises';
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';

const main = async () => {
  const { IEXEC_OUT } = process.env;

  let computedJsonObj = {};

  try {
    console.log('Starting JavaScript scoring logic iApp...');
    
    let protectedIntegerA;
    let usedProtectedData = false;

    try {
      // Decrypt integer A from protected data using DataProtector deserializer
      const deserializer = new IExecDataProtectorDeserializer();
      // Look for the key "A" which should contain our credit score integer
      protectedIntegerA = await deserializer.getValue('A', 'number');
      usedProtectedData = true;
      console.log('Successfully decrypted integer A from protected data');
    } catch (e) {
      console.log('Error decrypting protected data A:', e);
      
      // Fallback: try to get command line arguments
      const args = process.argv.slice(2);
      if (args.length > 0) {
        try {
          protectedIntegerA = parseInt(args[0]);
          if (isNaN(protectedIntegerA)) {
            throw new Error(`Invalid argument: ${args[0]}`);
          }
          console.log(`Using command line argument A: ${protectedIntegerA}`);
        } catch (error) {
          console.log('Environment variables:');
          for (const [key, value] of Object.entries(process.env)) {
            if (key.toLowerCase().includes('iexec') || key.toLowerCase().includes('arg')) {
              console.log(`  ${key} = ${value}`);
            }
          }
          throw new Error('No protected data A found and no valid command line arguments provided');
        }
      } else {
        console.log('Environment variables:');
        for (const [key, value] of Object.entries(process.env)) {
          if (key.toLowerCase().includes('iexec') || key.toLowerCase().includes('arg')) {
            console.log(`  ${key} = ${value}`);
          }
        }
        throw new Error('No protected data A found and no command line arguments provided');
      }
    }

    // TEE scoring logic: result = A * 2
    const result = protectedIntegerA * 2;
    console.log(`Applied scoring logic (A * 2) = ${result}`);

    // Create result data structure - hide input if from protected data
    let resultData;
    
    if (usedProtectedData) {
      resultData = {
        scoring_logic: "A * 2",
        result: result,
        status: "success",
        data_source: "protected_data"
      };
      console.log('Input from protected data - not included in output for security');
    } else {
      resultData = {
        input_A: protectedIntegerA,
        scoring_logic: "A * 2",
        result: result,
        status: "success",
        data_source: "command_line_args"
      };
    }

    // Write result to IEXEC_OUT
    const resultPath = `${IEXEC_OUT}/result.json`;
    await fs.writeFile(resultPath, JSON.stringify(resultData, null, 2));
    
    console.log(`Result written to output: ${result}`);

    // Build the "computed.json" object
    computedJsonObj = {
      'deterministic-output-path': resultPath,
    };
  } catch (e) {
    // Handle errors
    console.log(`Error in scoring logic: ${e}`);
    
    const errorData = {
      status: "error",
      error_message: String(e)
    };
    
    const resultPath = `${IEXEC_OUT}/result.json`;
    await fs.writeFile(resultPath, JSON.stringify(errorData, null, 2));

    // Build the "computed.json" object with an error message
    computedJsonObj = {
      'deterministic-output-path': resultPath,
      'error-message': String(e)
    };
  } finally {
    // Save the "computed.json" file
    await fs.writeFile(
      `${IEXEC_OUT}/computed.json`,
      JSON.stringify(computedJsonObj)
    );
  }
};

main();
