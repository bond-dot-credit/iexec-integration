#!/usr/bin/env python3

import zipfile
import os
from borsh_construct import I128

# Create a mock protected data ZIP file with integer A
def create_mock_protected_data(value_a=5, output_path="mock/protectedData/scoring_mock"):
    """
    Create a mock protected data file with integer A for testing
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Serialize integer A using borsh
    serialized_a = I128.build(value_a)
    
    # Create ZIP file with integer A
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.writestr('A', serialized_a)
    
    print(f"Created mock protected data at: {output_path}")
    print(f"Contains integer A = {value_a}")
    print(f"Serialized size: {len(serialized_a)} bytes")

if __name__ == "__main__":
    create_mock_protected_data()