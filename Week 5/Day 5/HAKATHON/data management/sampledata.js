const mongoose = require("mongoose");

const connectDatabase = require("../database");

const User = require("../schemas/userSchema");
const Issue = require("../schemas/issueSchema");


const seedDatabase = async () => {

    try {

        await connectDatabase();

        console.log("🌱 Starting Mtaafix sample data...");


        // Remove old sample data
        await User.deleteMany({});
        await Issue.deleteMany({});


        // ============================
        // USERS
        // ============================

        const users = await User.insertMany([

            {
                name: "Mtaafix Administrator",
                email: "admin@mtaafix.com",
                phone: "0700000000",
                password: "admin123",
                role: "admin",
                location: "Githogoro"
            },

            {
                name: "Community Member",
                email: "citizen@mtaafix.com",
                phone: "0711111111",
                password: "citizen123",
                role: "citizen",
                location: "Githogoro"
            },

            {
                name: "Mtaafix Volunteer",
                email: "volunteer@mtaafix.com",
                phone: "0722222222",
                password: "volunteer123",
                role: "volunteer",
                location: "Githogoro"
            }

        ]);


        const admin = users[0];
        const citizen = users[1];
        const volunteer = users[2];


        // ============================
        // COMMUNITY ISSUES
        // ============================

        await Issue.insertMany([

            {
                title: "Garbage Accumulation",

                description:
                    "Garbage has accumulated in the community and needs collection.",

                category: "Garbage",

                location:
                    "Githogoro, Runda View",

                latitude: -1.220000,

                longitude: 36.820000,

                priority: "High",

                status: "Pending",

                reportedBy: citizen._id
            },


            {
                title: "Blocked Drainage",

                description:
                    "The drainage system is blocked and may cause flooding during heavy rainfall.",

                category: "Drainage",

                location:
                    "Githogoro",

                latitude: -1.221000,

                longitude: 36.821000,

                priority: "Urgent",

                status: "Verified",

                reportedBy: citizen._id,

                assignedTo: volunteer._id
            },


            {
                title: "Damaged Road",

                description:
                    "Several potholes have developed on the road and require repair.",

                category: "Roads",

                location:
                    "Githogoro",

                latitude: -1.222000,

                longitude: 36.822000,

                priority: "Medium",

                status: "In Progress",

                reportedBy: citizen._id,

                assignedTo: volunteer._id
            },


            {
                title: "Broken Street Light",

                description:
                    "A street light is not working and the area needs maintenance.",

                category: "Street Lighting",

                location:
                    "Runda View",

                latitude: -1.223000,

                longitude: 36.823000,

                priority: "High",

                status: "Pending",

                reportedBy: citizen._id
            }

        ]);


        console.log(
            "✅ Mtaafix sample data inserted successfully!"
        );

        console.log(
            "👤 Users created:",
            users.length
        );

        console.log(
            "📋 Issues created: 4"
        );


        process.exit(0);

    } catch (error) {

        console.error(
            "❌ Error seeding database:",
            error.message
        );

        process.exit(1);
    }
};


seedDatabase();