// MongoDB Indexes Setup Script
// Run this script to create indexes for better query performance

use expense_tracker;

// Expenses collection indexes
print("Creating indexes for expenses collection...");

// User-based queries (most common)
db.expenses.createIndex({ "userId": 1, "date": -1 });
db.expenses.createIndex({ "userId": 1, "category": 1 });
db.expenses.createIndex({ "userId": 1, "merchant": 1 });
db.expenses.createIndex({ "userId": 1, "amount": 1 });
db.expenses.createIndex({ "userId": 1, "tags": 1 });
db.expenses.createIndex({ "userId": 1, "createdAt": -1 });

// Date-based queries
db.expenses.createIndex({ "date": -1 });
db.expenses.createIndex({ "userId": 1, "date": -1, "category": 1 });
db.expenses.createIndex({ "userId": 1, "date": -1, "amount": -1 });

// Category and merchant queries
db.expenses.createIndex({ "category": 1, "date": -1 });
db.expenses.createIndex({ "merchant": 1, "date": -1 });

// Amount-based queries
db.expenses.createIndex({ "amount": -1 });
db.expenses.createIndex({ "userId": 1, "amount": -1 });

// Text search index for description and merchant
db.expenses.createIndex({
   "description": "text",
   "merchant": "text"
}, {
   weights: {
      "description": 10,
      "merchant": 5
   },
   name: "expense_text_search"
});

// Compound indexes for analytics
db.expenses.createIndex({ "userId": 1, "category": 1, "date": -1 });
db.expenses.createIndex({ "userId": 1, "merchant": 1, "date": -1 });
db.expenses.createIndex({ "userId": 1, "date": -1, "category": 1, "amount": -1 });

// Sparse indexes for optional fields
db.expenses.createIndex({ "receipt": 1 }, { sparse: true });
db.expenses.createIndex({ "tags": 1 }, { sparse: true });

// Geospatial index for location-based queries
db.expenses.createIndex({ "metadata.location": "2dsphere" }, { sparse: true });

print("Expenses indexes created successfully!");

// Recurring expenses collection indexes
print("Creating indexes for recurring_expenses collection...");

db.recurring_expenses.createIndex({ "userId": 1, "isActive": 1 });
db.recurring_expenses.createIndex({ "userId": 1, "nextDate": 1 });
db.recurring_expenses.createIndex({ "nextDate": 1, "isActive": 1 });
db.recurring_expenses.createIndex({ "userId": 1, "pattern.frequency": 1 });
db.recurring_expenses.createIndex({ "createdAt": -1 });

print("Recurring expenses indexes created successfully!");

// Expense imports collection indexes
print("Creating indexes for expense_imports collection...");

db.expense_imports.createIndex({ "userId": 1, "createdAt": -1 });
db.expense_imports.createIndex({ "userId": 1, "status": 1 });
db.expense_imports.createIndex({ "status": 1, "createdAt": -1 });
db.expense_imports.createIndex({ "createdAt": -1 });

print("Expense imports indexes created successfully!");

// Create partial indexes for performance optimization
print("Creating partial indexes for optimization...");

// Index only for expenses with receipts
db.expenses.createIndex(
   { "userId": 1, "receipt": 1 },
   {
      partialFilterExpression: { "receipt": { $exists: true, $ne: null } },
      name: "expenses_with_receipts"
   }
);

// Index only for categorized expenses
db.expenses.createIndex(
   { "userId": 1, "category": 1, "date": -1 },
   {
      partialFilterExpression: { "category": { $exists: true, $ne: null } },
      name: "categorized_expenses"
   }
);

// Index only for expenses with merchants
db.expenses.createIndex(
   { "userId": 1, "merchant": 1, "date": -1 },
   {
      partialFilterExpression: { "merchant": { $exists: true, $ne: null } },
      name: "expenses_with_merchants"
   }
);

// Index only for tagged expenses
db.expenses.createIndex(
   { "userId": 1, "tags": 1 },
   {
      partialFilterExpression: { "tags": { $exists: true, $not: { $size: 0 } } },
      name: "tagged_expenses"
   }
);

// Index for recent expenses (last 90 days)
db.expenses.createIndex(
   { "userId": 1, "date": -1 },
   {
      partialFilterExpression: {
         "date": {
            $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
         }
      },
      name: "recent_expenses",
      expireAfterSeconds: 7776000 // 90 days
   }
);

print("Partial indexes created successfully!");

// Create TTL indexes for data cleanup
print("Creating TTL indexes for automatic cleanup...");

// Auto-delete completed imports after 30 days
db.expense_imports.createIndex(
   { "createdAt": 1 },
   {
      expireAfterSeconds: 2592000, // 30 days
      partialFilterExpression: { "status": "completed" }
   }
);

// Auto-delete failed imports after 7 days
db.expense_imports.createIndex(
   { "createdAt": 1 },
   {
      expireAfterSeconds: 604800, // 7 days
      partialFilterExpression: { "status": "failed" }
   }
);

print("TTL indexes created successfully!");

// Create unique indexes for data integrity
print("Creating unique indexes for data integrity...");

// Prevent duplicate recurring expenses
db.recurring_expenses.createIndex(
   {
      "userId": 1,
      "templateExpense.description": 1,
      "templateExpense.amount": 1,
      "pattern.frequency": 1
   },
   {
      unique: true,
      name: "unique_recurring_expense"
   }
);

print("Unique indexes created successfully!");

// Display index information
print("\n=== Index Summary ===");
print("Expenses collection indexes:");
db.expenses.getIndexes().forEach(function(index) {
   print("- " + index.name + ": " + JSON.stringify(index.key));
});

print("\nRecurring expenses collection indexes:");
db.recurring_expenses.getIndexes().forEach(function(index) {
   print("- " + index.name + ": " + JSON.stringify(index.key));
});

print("\nExpense imports collection indexes:");
db.expense_imports.getIndexes().forEach(function(index) {
   print("- " + index.name + ": " + JSON.stringify(index.key));
});

print("\nAll MongoDB indexes created successfully!");
print("Database is optimized for expense tracking queries.");

// Verify index creation and provide performance tips
print("\n=== Performance Tips ===");
print("1. Most queries should use userId as the first field in the index");
print("2. Date-based queries will use the date indexes");
print("3. Text search will use the full-text search index");
print("4. Category and merchant filters will use compound indexes");
print("5. TTL indexes will automatically clean up old data");
print("6. Partial indexes optimize storage for conditional queries");

print("\n=== Maintenance Commands ===");
print("To check index usage: db.expenses.getIndexes()");
print("To check index stats: db.expenses.aggregate([{$indexStats: {}}])");
print("To rebuild indexes: db.expenses.reIndex()");
print("To drop an index: db.expenses.dropIndex('index_name')");