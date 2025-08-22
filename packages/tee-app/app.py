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
        
        # Fallback: try multiple methods to get command line arguments
        protected_integer_A = None
        
        # Method 1: sys.argv (direct execution)
        args = sys.argv[1:]
        if len(args) > 0:
            try:
                protected_integer_A = int(args[0])
                print(f"Using sys.argv argument A: {protected_integer_A}")
            except ValueError:
                print(f"Invalid sys.argv argument: {args[0]}")
        
        # Method 2: IEXEC_ARGS environment variable (iExec execution)
        if protected_integer_A is None:
            iexec_args = os.getenv('IEXEC_ARGS')
            if iexec_args:
                try:
                    # IEXEC_ARGS might be space-separated
                    args_list = iexec_args.strip().split()
                    if len(args_list) > 0:
                        protected_integer_A = int(args_list[0])
                        print(f"Using IEXEC_ARGS argument A: {protected_integer_A}")
                except (ValueError, IndexError):
                    print(f"Invalid IEXEC_ARGS: {iexec_args}")
        
        # Method 3: Check all environment variables for args
        if protected_integer_A is None:
            for key, value in os.environ.items():
                if 'arg' in key.lower() and value.isdigit():
                    try:
                        protected_integer_A = int(value)
                        print(f"Using environment variable {key}={value} as argument A: {protected_integer_A}")
                        break
                    except ValueError:
                        continue
        
        if protected_integer_A is None:
            print("Environment variables:")
            for key, value in sorted(os.environ.items()):
                if 'iexec' in key.lower() or 'arg' in key.lower():
                    print(f"  {key} = {value}")
            raise Exception("No protected data A found and no valid command line arguments provided")
    
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
