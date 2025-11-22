from flask import Flask, jsonify, request, send_file
from flask_cors import CORS 
import json
import os
import uuid
from datetime import datetime
from functools import wraps

# --- Configuration & Initialization ---
app = Flask(__name__)
# CRITICAL: Allow cross-origin requests from the frontend (required when running on different origins)
CORS(app) 
DB_FILE = 'ims_data.json'
PORT = 8081 
LOW_STOCK_THRESHOLD = 20 # KPI threshold

# --- Core Data Models ---

def generate_id():
    """Generates a short, unique ID for documents and products."""
    return str(uuid.uuid4())[:8].upper()

# --- Database Simulation (File I/O) ---

def load_data():
    """Loads all data from the JSON file or initializes defaults."""
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("Warning: Corrupted JSON file. Initializing default data.")
            pass
    
    # Default initial data structure (matching requirements/image)
    default_data = {
        "products": {
            "P1A2B3C4": {"id": "P1A2B3C4", "category": "Electronics", "name": "Laptop Model X", "location_id": "W001", "stock_level": 120, "reorder_point": 30},
            "P5D6E7F8": {"id": "P5D6E7F8", "category": "Peripherals", "name": "Wireless Mouse Z", "location_id": "W002", "stock_level": 35, "reorder_point": 50},
            "P9G0H1I2": {"id": "P9G0H1I2", "category": "Components", "name": "Memory Module 16GB", "location_id": "W001", "stock_level": 1000, "reorder_point": 100},
            "P00A0B0C": {"id": "P00A0B0C", "category": "Apparel", "name": "Safety Vest", "location_id": "W002", "stock_level": 10, "reorder_point": 50},
            "P0D0E0F0": {"id": "P0D0E0F0", "category": "Home Goods", "name": "Cleaning Wipes", "location_id": "W001", "stock_level": 5, "reorder_point": 10}, # Out of stock item
        },
        "documents": {
            # Delivery (Ready - Pending)
            "D001": {"id": "D001", "type": "Delivery", "status": "Ready", "created_by": "SM001", "created_at": datetime.now().isoformat(), 
                     "lines": [{"product_id": "P1A2B3C4", "qty": 5, "category": "Electronics"}], "source_location": "W001", 
                     "category_list": ["Electronics"]},
            # Receipt (Waiting - Pending)
            "R002": {"id": "R002", "type": "Receipt", "status": "Waiting", "created_by": "InvManager", "created_at": datetime.now().isoformat(), 
                     "lines": [{"product_id": "P9G0H1I2", "qty": 200, "category": "Components"}], "target_location": "W001",
                     "category_list": ["Components"]},
            # Transfer (Draft - Pending)
            "T003": {"id": "T003", "type": "Internal", "status": "Draft", "created_by": "WH002", "created_at": datetime.now().isoformat(), 
                     "lines": [{"product_id": "P5D6E7F8", "qty": 20, "category": "Peripherals"}], "source_location": "W002", "target_location": "W001",
                     "category_list": ["Peripherals"]},
            # Adjustment (Done - History)
            "A004": {"id": "A004", "type": "Adjustment", "status": "Done", "created_by": "StockMaster", "created_at": datetime.now().isoformat(), 
                     "lines": [{"product_id": "P00A0B0C", "qty": -10, "category": "Apparel"}], "category_list": ["Apparel"]},
        },
        "locations": {
            "W001": {"id": "W001", "name": "Main Warehouse", "manager": "Alice"},
            "W002": {"id": "W002", "name": "Overflow Storage", "manager": "Bob"}
        }
    }
    save_data(default_data)
    return default_data

def save_data(data):
    """Saves the current data state to the JSON file."""
    try:
        with open(DB_FILE, 'w') as f:
            json.dump(data, f, indent=4)
    except IOError as e:
        print(f"Error saving data: {e}")

# --- Authentication Simulation ---

def require_auth(f):
    """Decorator to enforce a simple mock authentication check via header."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'User-Id' not in request.headers:
            return jsonify({"success": False, "message": "Authentication required. Missing User-Id header."}), 401
        # In a real system, validate the token here
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/auth/login', methods=['POST'])
def mock_login():
    """Simulates a user login/signup and returns a mock user data."""
    data = request.get_json()
    email = data.get('email', '')
    
    user_id = "SM001" if "stockmaster" in email.lower() else "WH002"
    role = "StockMaster" if user_id == "SM001" else "WarehouseStaff"

    return jsonify({
        "success": True, 
        "user_id": user_id,
        "role": role,
        "message": f"Successfully logged in as {role}.",
        "profile_name": "StockMaster" if user_id == "SM001" else "Warehouse Staff"
    })

# --- Dashboard & Filtering Endpoints ---

@app.route('/')
def serve_index():
    """Serves the frontend React application."""
    # Assumes IMS_Dashboard.jsx is compiled/served as index.html
    return send_file('IMS_Dashboard.jsx')

@app.route('/api/dashboard/summary', methods=['GET'])
@require_auth
def get_dashboard_summary():
    """Calculates and provides all Dashboard KPIs."""
    data = load_data()
    products = data['products'].values()
    docs = data['documents'].values()
    
    # 1. Total Products in Stock
    total_products_in_stock = sum(p['stock_level'] for p in products)
    
    # 2. Low Stock / Out of Stock Items
    low_stock_items = len([p for p in products if p['stock_level'] > 0 and p['stock_level'] <= LOW_STOCK_THRESHOLD])
    out_of_stock_items = len([p for p in products if p['stock_level'] == 0])

    # 3. Pending Documents (KPIs)
    pending_receipts = len([d for d in docs if d['type'] == 'Receipt' and d['status'] in ['Waiting', 'Ready']])
    pending_deliveries = len([d for d in docs if d['type'] == 'Delivery' and d['status'] in ['Waiting', 'Ready']])
    transfers_scheduled = len([d for d in docs if d['type'] == 'Internal' and d['status'] in ['Waiting', 'Ready']])
    adjustments_pending = len([d for d in docs if d['type'] == 'Adjustment' and d['status'] in ['Draft', 'Waiting', 'Ready']])
    
    # Product Availability by Location (for the chart)
    location_stock = {}
    for p in products:
        loc_id = p['location_id']
        location_stock[loc_id] = location_stock.get(loc_id, 0) + p['stock_level']
    
    location_chart_data = [{'location': data['locations'][loc]['name'], 'stock': stock} 
                           for loc, stock in location_stock.items()]

    # Product Categories Breakdown (for the pie chart)
    category_counts = {}
    total_stock = total_products_in_stock
    for p in products:
        category = p['category']
        category_counts[category] = category_counts.get(category, 0) + p['stock_level']
        
    category_chart_data = [{'name': cat, 'value': count, 'percent': round(count / total_stock * 100, 1)} 
                           for cat, count in category_counts.items()]


    return jsonify({
        "total_products_in_stock": total_products_in_stock,
        "low_stock_items": low_stock_items,
        "out_of_stock_items": out_of_stock_items,
        "pending_receipts": pending_receipts,
        "pending_deliveries": pending_deliveries,
        "transfers_scheduled": transfers_scheduled,
        "adjustments_pending": adjustments_pending,
        "locations": data['locations'],
        "location_chart_data": location_chart_data,
        "category_chart_data": category_chart_data,
    })

@app.route('/api/documents/filter', methods=['POST'])
@require_auth
def filter_documents():
    """Applies multiple dynamic filters to the documents list and returns recent operations."""
    data = load_data()
    all_docs = list(data['documents'].values())
    filters = request.get_json()
    
    filtered_docs = all_docs

    # Filter implementation (same as previous iteration for robust filtering)
    # ... [Filtering logic remains here] ...

    # Filter by Document Type
    doc_types = filters.get('document_type')
    if doc_types and isinstance(doc_types, list):
        filtered_docs = [doc for doc in filtered_docs if doc['type'] in doc_types]

    # Filter by Status
    statuses = filters.get('status')
    if statuses and isinstance(statuses, list):
        filtered_docs = [doc for doc in filtered_docs if doc['status'] in statuses]

    # Filter by Location
    locations = filters.get('location')
    if locations and isinstance(locations, list):
        filtered_docs = [doc for doc in filtered_docs 
                         if doc.get('source_location') in locations or doc.get('target_location') in locations]

    # Filter by Product Category
    categories = filters.get('category')
    if categories and isinstance(categories, list):
        filtered_docs = [doc for doc in filtered_docs 
                         if any(c in categories for c in doc.get('category_list', []))]

    filtered_docs.sort(key=lambda x: x['created_at'], reverse=True)
    
    return jsonify({"count": len(filtered_docs), "documents": filtered_docs[:15]}) # Return only top 15 for 'Recent Operations'

@app.route('/api/stock/products', methods=['GET'])
@require_auth
def get_products():
    """Returns the current list of products."""
    data = load_data()
    products_list = list(data['products'].values())
    return jsonify({"count": len(products_list), "products": products_list})

# --- Main Run ---
if __name__ == '__main__':
    load_data()
    print("-" * 50)
    print(f"IMS Backend Running on port {PORT}")
    print(f"Access Frontend at http://127.0.0.1:{PORT}/")
    print("-" * 50)
    app.run(debug=True, port=PORT)