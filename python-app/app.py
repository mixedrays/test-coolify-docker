from flask import Flask, jsonify, request
import numpy as np # Import numpy

app = Flask(__name__)

# Define sigmoid activation function
def sigmoid(x):
    return 1 / (1 + np.exp(-x))

@app.route('/py-data')
def get_data():
    """Returns sample data including the 'input' query parameter and processes it through a simple neuron."""
    # Read the 'input' query parameter
    input_param = request.args.get('input', '0') # Default to '0' if not found

    # Simple neural network simulation (single neuron)
    processed_output = None
    error_message = None
    try:
        # Convert input parameter to float
        input_value = float(input_param)

        # Define fixed weights and bias for a single neuron
        # Assuming the input is a single value, we need one weight and one bias.
        weights = np.array([0.5]) # Single weight for the single input feature
        bias = np.array([-0.1])    # Single bias

        # Calculate the neuron's activation (linear combination + bias)
        activation = np.dot(input_value, weights) + bias

        # Apply the sigmoid function
        processed_output = sigmoid(activation).tolist() # Convert numpy array/scalar to list/float for JSON

    except ValueError:
        error_message = "Invalid input: Please provide a numeric value for 'input'."
        processed_output = None # Ensure output is None if conversion fails
    except Exception as e:
        error_message = f"An error occurred during processing: {str(e)}"
        processed_output = None

    response_data = {
        "input_received": input_param,
        "processed_output": processed_output
    }
    if error_message:
        response_data["error"] = error_message

    return jsonify(response_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
