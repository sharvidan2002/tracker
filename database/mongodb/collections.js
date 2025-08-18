// MongoDB Collections Setup Script
// Run this script to create collections and initial setup

// Create database and collections
use expense_tracker;

// Create expenses collection
db.createCollection("expenses", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["userId", "amount", "description", "date"],
         properties: {
            userId: {
               bsonType: "string",
               description: "User ID is required and must be a string"
            },
            amount: {
               bsonType: "number",
               minimum: 0.01,
               description: "Amount must be a positive number"
            },
            description: {
               bsonType: "string",
               minLength: 1,
               maxLength: 255,
               description: "Description is required and must be between 1-255 characters"
            },
            category: {
               bsonType: "string",
               maxLength: 100,
               description: "Category must be a string with max 100 characters"
            },
            merchant: {
               bsonType: "string",
               maxLength: 100,
               description: "Merchant must be a string with max 100 characters"
            },
            date: {
               bsonType: "date",
               description: "Date must be a valid date"
            },
            tags: {
               bsonType: "array",
               items: {
                  bsonType: "string",
                  maxLength: 50
               },
               maxItems: 10,
               description: "Tags must be an array of strings, max 10 items"
            },
            receipt: {
               bsonType: "string",
               description: "Receipt URL must be a string"
            },
            metadata: {
               bsonType: "object",
               properties: {
                  source: {
                     bsonType: "string",
                     enum: ["manual", "imported", "api"]
                  },
                  confidence: {
                     bsonType: "number",
                     minimum: 0,
                     maximum: 1
                  },
                  originalDescription: {
                     bsonType: "string",
                     maxLength: 255
                  },
                  location: {
                     bsonType: "object",
                     properties: {
                        latitude: {
                           bsonType: "number",
                           minimum: -90,
                           maximum: 90
                        },
                        longitude: {
                           bsonType: "number",
                           minimum: -180,
                           maximum: 180
                        },
                        address: {
                           bsonType: "string",
                           maxLength: 200
                        }
                     }
                  }
               }
            }
         }
      }
   }
});

// Create recurring_expenses collection
db.createCollection("recurring_expenses", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["userId", "templateExpense", "pattern", "nextDate", "isActive"],
         properties: {
            userId: {
               bsonType: "string",
               description: "User ID is required"
            },
            templateExpense: {
               bsonType: "object",
               required: ["amount", "description"],
               properties: {
                  amount: {
                     bsonType: "number",
                     minimum: 0.01
                  },
                  description: {
                     bsonType: "string",
                     minLength: 1,
                     maxLength: 255
                  },
                  category: {
                     bsonType: "string",
                     maxLength: 100
                  },
                  merchant: {
                     bsonType: "string",
                     maxLength: 100
                  },
                  tags: {
                     bsonType: "array",
                     items: {
                        bsonType: "string"
                     }
                  }
               }
            },
            pattern: {
               bsonType: "object",
               required: ["frequency", "interval"],
               properties: {
                  frequency: {
                     bsonType: "string",
                     enum: ["daily", "weekly", "monthly", "yearly"]
                  },
                  interval: {
                     bsonType: "int",
                     minimum: 1
                  },
                  dayOfWeek: {
                     bsonType: "int",
                     minimum: 0,
                     maximum: 6
                  },
                  dayOfMonth: {
                     bsonType: "int",
                     minimum: 1,
                     maximum: 31
                  },
                  monthOfYear: {
                     bsonType: "int",
                     minimum: 1,
                     maximum: 12
                  }
               }
            },
            nextDate: {
               bsonType: "date"
            },
            isActive: {
               bsonType: "bool"
            },
            createdCount: {
               bsonType: "int",
               minimum: 0
            },
            maxOccurrences: {
               bsonType: "int",
               minimum: 1
            },
            endDate: {
               bsonType: "date"
            }
         }
      }
   }
});

// Create expense_imports collection
db.createCollection("expense_imports", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["userId", "fileName", "source", "status"],
         properties: {
            userId: {
               bsonType: "string"
            },
            fileName: {
               bsonType: "string",
               maxLength: 255
            },
            fileSize: {
               bsonType: "number",
               minimum: 0
            },
            source: {
               bsonType: "string",
               enum: ["csv", "bank", "creditCard", "manual"]
            },
            status: {
               bsonType: "string",
               enum: ["pending", "processing", "completed", "failed"]
            },
            totalRows: {
               bsonType: "int",
               minimum: 0
            },
            processedRows: {
               bsonType: "int",
               minimum: 0
            },
            successfulRows: {
               bsonType: "int",
               minimum: 0
            },
            failedRows: {
               bsonType: "int",
               minimum: 0
            }
         }
      }
   }
});

print("MongoDB collections created successfully!");