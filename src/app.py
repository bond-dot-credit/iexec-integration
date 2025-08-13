import json
import os
import sys
import protected_data

IEXEC_OUT = os.getenv('IEXEC_OUT')

computed_json = {}

try:
    print("Starting scoring logic iApp...")
    
    # Decrypt integer A from protected data using MEDPRIVATE key
    used_protected_data = False
    try:
        # Attempt to get the encrypted integer A from protected data
        protected_integer_A = protected_data.getValue('A', 'i128')
        used_protected_data = True
        print(f"Successfully decrypted integer A from protected data")
    except Exception as e:
        print('Error decrypting protected data A:', e)
        # Fallback: use command line argument if protected data fails
        args = sys.argv[1:]
        if len(args) > 0:
            try:
                protected_integer_A = int(args[0])
                print(f"Using command line argument A: {protected_integer_A}")
            except ValueError:
                raise Exception("No valid integer A found in protected data or arguments")
        else:
            raise Exception("No protected data A found and no command line arguments provided")
    
    # TEE scoring logic: result = A * 2
    result = protected_integer_A * 2
    print(f"Applied scoring logic (A * 2) = {result}")
    
    # Create result data structure - hide input if from protected data
    if used_protected_data:
        result_data = {
            "scoring_logic": "A * 2",
            "result": result,
            "status": "success",
            "data_source": "protected_data"
        }
        print("Input from protected data - not included in output for security")
    else:
        result_data = {
            "input_A": protected_integer_A,
            "scoring_logic": "A * 2",
            "result": result,
            "status": "success",
            "data_source": "command_line_args"
        }
    
    # unencrypted result to output file
    with open(IEXEC_OUT + '/result.json', 'w') as f:
        json.dump(result_data, f, indent=2)
    
    print(f"Result written to output: {result}")
    computed_json = {'deterministic-output-path': IEXEC_OUT + '/result.json'}
    
except Exception as e:
    print(f"Error in scoring logic: {e}")
    error_data = {
        "status": "error",
        "error_message": str(e)
    }
    
    with open(IEXEC_OUT + '/result.json', 'w') as f:
        json.dump(error_data, f, indent=2)
    
    computed_json = {'deterministic-output-path': IEXEC_OUT + '/result.json',
                     'error-message': str(e)}
finally:
    with open(IEXEC_OUT + '/computed.json', 'w') as f:
        json.dump(computed_json, f)
