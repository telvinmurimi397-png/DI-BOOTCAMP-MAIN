const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,

            enum: [
                "Garbage",
                "Drainage",
                "Roads",
                "Street Lighting",
                "Water",
                "Security",
                "Environment",
                "Other"
            ],

            required: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        latitude: {
            type: Number
        },

        longitude: {
            type: Number
        },

        image: {
            type: String,
            default: ""
        },

        priority: {
            type: String,

            enum: [
                "Low",
                "Medium",
                "High",
                "Urgent"
            ],

            default: "Medium"
        },

        status: {
            type: String,

            enum: [
                "Pending",
                "Verified",
                "In Progress",
                "Resolved",
                "Rejected"
            ],

            default: "Pending"
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            default: null
        },

        comments: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },

                message: {
                    type: String,
                    trim: true
                },

                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

        createdAt: {
            type: Date,
            default: Date.now
        },

        updatedAt: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports = mongoose.model("Issue", issueSchema);