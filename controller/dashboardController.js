const Application = require('../model/applicationModal');
const Position = require('../model/positionModal');
const Interview = require('../model/interviewModal');

let cacheDashboardSummary;

const getDashboardSummary = async (req, res) => {
    const cache = req.query.cache;

    const currentTime = new Date();
    const firstDayOfMonth = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1);
    const lastDayOfMonth = new Date(currentTime.getFullYear(), currentTime.getMonth() + 1, 0, 23, 59, 59, 999);
const currentMonth = currentTime.getMonth(); // 0 = Jan, 11 = Dec

// Find the start month of the current quarter
const quarterStartMonth = Math.floor(currentMonth / 3) * 3;

// First day of the quarter (00:00:00)
const firstDayOfQuarter = new Date(currentTime.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);

// Last day of the quarter (23:59:59.999)
const lastDayOfQuarter = new Date(
  currentTime.getFullYear(),
  quarterStartMonth + 3, // start of next quarter
  0, // day 0 = last day of previous month → end of this quarter
  23, 59, 59, 999
);

console.log("First day of quarter:", firstDayOfQuarter);
console.log("Last day of quarter:", lastDayOfQuarter);


    // Day of week (0 = Sunday, 1 = Monday, ... 6 = Saturday)
const dayOfWeek = currentTime.getDay();

// If we want Monday as the first day of the week:
const diffToMonday = (dayOfWeek + 6) % 7; // shifts Sunday (0) to 6, Monday (1) to 0

// Start of the week (Monday 00:00:00)
const firstDayOfWeek = new Date(currentTime);
firstDayOfWeek.setDate(currentTime.getDate() - diffToMonday);
firstDayOfWeek.setHours(0, 0, 0, 0);

// End of the week (Sunday 23:59:59.999)
const lastDayOfWeek = new Date(firstDayOfWeek);
lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
lastDayOfWeek.setHours(23, 59, 59, 999);



    // Check if cache exists and is not expired
    if(cache === 'true') {
   if (
        cacheDashboardSummary &&
        cacheDashboardSummary.exp > currentTime
    ) {
        return res.status(200).json({ ...cacheDashboardSummary, form: "cache" });
    }    
}
 

    try {
        // uery fresh data
          const totalApplication = await Application.countDocuments({
            appliedDate: {
                $gte: firstDayOfMonth,
                $lte: lastDayOfMonth
            }
        });
        const activePositionsCount = await Position.where({ status: "active" }).countDocuments();
        const applicationAccepted = await Application.countDocuments({
            status: "accepted",
            appliedDate: {
                $gte: firstDayOfQuarter,
                $lte: lastDayOfQuarter
            }
        });
        const interviewScheduled = await Interview.countDocuments({
           status: "scheduled",
           date: {
            $gte: firstDayOfWeek,
            $lte: lastDayOfWeek
           }    
        });

        cacheDashboardSummary = {
            data: {
                totalApplication: totalApplication,
                position: activePositionsCount,
                applicationAccepted: applicationAccepted,
                interviewScheduled: interviewScheduled
                
            },
            exp: new Date(Date.now() + 30 * 1000)
            , cacheAt: currentTime
        };

        return res.status(200).json(cacheDashboardSummary);
    }
    catch (error) {
        res.status(500).json({
            message: "Error Fetching position SummRY",
            error: error.message
        });
    }

};

let cacheStatusSummary;

const applicationStatusCount = async (req, res) =>{

    const cache = req.query.cache;

    const currentTime = new Date();

    // Check if cache exists and is not expired
    if(cache === 'true') {
   if (
        cacheStatusSummary &&
        cacheStatusSummary.exp > currentTime
    ) {
        return res.status(200).json({ ...cacheStatusSummary, form: "cache" });
    }
}    


        try {
        // uery fresh data
          const totalPending = await Application.countDocuments({
            status: "pending"
        });
         const totalReviewing = await Application.countDocuments({
            status: "reviewing"
        });
        const totalInterviewed = await Interview.countDocuments({
            status: "completed"
        });
           const totalInterviewScheduled = await Application.countDocuments({
            status: "interview-scheduled"
        });
           const totalAccepted = await Application.countDocuments({
            status: "accepted"
        });
           const totalRejected = await Application.countDocuments({
            status: "rejected"
        });

        cacheStatusSummary = {
            data: {
                pending: totalPending,
                reviewing: totalReviewing,
                interviewed: totalInterviewed,  
                interviewScheduled: totalInterviewScheduled,
                accepted: totalAccepted,
                rejected: totalRejected
            },
            exp: new Date(Date.now() + 30 * 1000)
            , cacheAt: currentTime
        };

        return res.status(200).json(cacheStatusSummary);
    }
    catch (error) {
        res.status(500).json({
            message: "Error Fetching position SummRY",
            error: error.message
        });
    }
}

let cacheDepartmentSummary;

const departmentSummary = async (req, res) =>{

    const cache = req.query.cache;

    const currentTime = new Date();

    // Check if cache exists and is not expired
    if(cache === 'true') {
   if (
        cacheDepartmentSummary &&
        cacheDepartmentSummary.exp > currentTime
    ) {
        return res.status(200).json({ ...cacheDepartmentSummary, form: "cache" });
    }
}    

    try {
        // uery fresh data
          const totalPending = await Application.countDocuments({
            status: "pending"
        });
         const totalReviewing = await Application.countDocuments({
            status: "reviewing"
        });
        const totalInterviewed = await Interview.countDocuments({
            status: "completed"
        });
           const totalInterviewScheduled = await Application.countDocuments({
            status: "interview-scheduled"
        });
           const totalAccepted = await Application.countDocuments({
            status: "accepted"
        });
           const totalRejected = await Application.countDocuments({
            status: "rejected"
        });

        cacheStatusSummary = {
            data: {
                pending: totalPending,
                reviewing: totalReviewing,
                interviewed: totalInterviewed,  
                interviewScheduled: totalInterviewScheduled,
                accepted: totalAccepted,
                rejected: totalRejected
            },
            exp: new Date(Date.now() + 30 * 1000)
            , cacheAt: currentTime
        };

        return res.status(200).json(cacheDepartmentSummary);
    }
    catch (error) {
        res.status(500).json({
            message: "Error Fetching position SummRY",
            error: error.message
        });
    }
}




module.exports = {
    getDashboardSummary,
    applicationStatusCount,
    departmentSummary 
}