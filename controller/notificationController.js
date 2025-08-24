const Notification = require('../model/notificationModal'); // Add this import


// Helper function to generate relative time
const getRelativeTime = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
};


// Helper function to detect member changes


// Helper function to get role permissions description
const getRolePermissions = (role, department) => {
    const rolePermissions = {
        'recruiter': 'access to applications and interview scheduling',
        'senior recruiter': 'additional permissions for position management',
        'hr manager': 'full HR operations and team management capabilities',
        'team lead': 'team leadership and project oversight permissions',
        'manager': 'departmental management and reporting access',
        'coordinator': 'project coordination and administrative permissions',
        'specialist': 'specialized tools and domain-specific access',
        'analyst': 'data analysis and reporting capabilities',
        'director': 'strategic planning and high-level management access',
        'supervisor': 'supervisory permissions and team oversight'
    };

    // Try to find exact role match first
    const exactMatch = rolePermissions[role.toLowerCase()];
    if (exactMatch) return exactMatch;

    // If no exact match, provide generic description based on role keywords
    const roleLower = role.toLowerCase();
    if (roleLower.includes('senior')) return 'elevated permissions and advanced system access';
    if (roleLower.includes('manager')) return 'management permissions and team oversight';
    if (roleLower.includes('lead')) return 'leadership permissions and project management';
    if (roleLower.includes('director')) return 'executive-level permissions and strategic access';

    return 'appropriate system permissions and access rights';
};

// Helper function to create member update notification
const createMemberUpdateNotification = async (existingMember, updatedMember, changes) => {
    try {
        const now = new Date();

        // Focus on the most important change (role changes have priority)
        const roleChange = changes.find(change => change.type === 'role');
        const departmentChange = changes.find(change => change.type === 'department');
        const nameChange = changes.find(change => change.type === 'name');

        let title, message, priority;

        if (roleChange) {
            // Role update notification (matches your example)
            title = "Role Permission Updated";
            const permissions = getRolePermissions(roleChange.newValue, updatedMember.department);
            message = `${updatedMember.name}'s role has been updated to ${roleChange.newValue} with ${permissions}.`;
            priority = "medium"; // Role changes are more important
        } else if (departmentChange) {
            // Department change notification
            title = "Team Assignment Updated";
            message = `${updatedMember.name} has been transferred from ${departmentChange.oldValue} to ${departmentChange.newValue} department.`;
            priority = "low";
        } else if (nameChange) {
            // Name change notification
            title = "Member Profile Updated";
            message = `Team member profile updated: ${nameChange.oldValue} is now listed as ${nameChange.newValue}.`;
            priority = "low";
        } else {
            // Generic update for other changes
            title = "Member Details Updated";
            message = `${updatedMember.name}'s profile information has been updated.`;
            priority = "low";
        }

        const notificationData = {
            type: "team",
            title,
            message,
            time: getRelativeTime(now),
            date: now,
            read: false,
            avatar: "/placeholder.svg?height=40&width=40",
            actionUrl: "/settings", // Matches your example
            priority
        };

        const notification = new Notification(notificationData);
        await notification.save();

        console.log(`✅ Notification created for member update: ${updatedMember.name}`);
        return notification;
    } catch (error) {
        console.error(`❌ Failed to create notification for member update:`, error);
        return null;
    }
};



// Helper function to create interview update notification
const createInterviewUpdateNotification = async (existingInterview, updatedInterview, changes) => {
    try {
        const now = new Date();

        // Determine priority based on changes and status
        const getPriority = (status, changes) => {
            if (status === 'cancelled' || changes.includes('status updated to cancelled')) return 'high';
            if (status === 'scheduled' || changes.includes('date changed') || changes.includes('time changed')) return 'medium';
            return 'low';
        };

        // Create descriptive message
        const candidateName = `${existingInterview.applicantId.firstName} ${existingInterview.applicantId.lastName}`;
        const position = existingInterview.applicantId.positionTitle;
        const changesText = changes.length > 0 ? changes.slice(0, 2).join(' and ') : 'details updated';

        const notificationData = {
            type: "interview", // Using "interview" instead of "application" since this is interview-related
            title: `Inteview ${updatedInterview.status.toUpperCase()}`,
            message: `Interview for ${candidateName} (${position} position) has been ${updatedInterview.status.toUpperCase()}. ${changesText.charAt(0).toUpperCase() + changesText.slice(1)}.`,
            time: getRelativeTime(now),
            date: now,
            read: false,
            avatar: "/placeholder.svg?height=40&width=40",
            actionUrl: `/interviews/${updatedInterview._id}`, // Link to specific interview
            priority: getPriority(updatedInterview.status, changes)
        };

        const notification = new Notification(notificationData);
        await notification.save();

        console.log(`✅ Notification created for interview update: ${updatedInterview._id}`);
        return notification;
    } catch (error) {
        console.error(`❌ Failed to create notification for interview update:`, error);
        return null;
    }
};




// Helper function to create notification
const createApplicationNotification = async (application, position) => {
    try {

        console.log('alll', application)
        const now = new Date();

        // Create notification data
        const notificationData = {
            type: "application",
            title: "New Application Received",
            message: `${application.firstName} ${application.lastName} applied for ${position.title} position. Application includes portfolio: ${application.portfolioUrl}`,
            time: getRelativeTime(now),
            date: now,
            read: false,
            avatar: "/placeholder.svg?height=40&width=40", // You might want to use applicant's avatar if available
            actionUrl: `/applications/${application._id}`, // Link to specific application
            priority: "high"
        };

        const notification = new Notification(notificationData);
        await notification.save();

        console.log(`✅ Notification created for application: ${application._id}`);
        return notification;
    } catch (error) {
        console.error(`❌ Failed to create notification for application ${application._id}:`, error);
        // Don't throw error - notification failure shouldn't break the application process
        return null;
    }
};


// Helper function to create team member notification
const createMemberNotification = async (member) => {
    try {
        const now = new Date();

        // Generate role description based on role
        const getRoleDescription = (role) => {
            const roleDescriptions = {
                'recruiter': 'access to applications and interview scheduling',
                'manager': 'team management and reporting capabilities',
                'hr': 'HR operations and employee management',
                'coordinator': 'project coordination and task management',
                'analyst': 'data analysis and reporting tools',
                'specialist': 'specialized tools and resources'
            };

            return roleDescriptions[role.toLowerCase()] || 'appropriate system access and permissions';
        };

        // Create notification data
        const notificationData = {
            type: "team",
            title: "Team Member Added",
            message: `${member.name} has been added to the ${member.department || 'team'} team with ${member.role} role. They will have ${getRoleDescription(member.role)}.`,
            time: getRelativeTime(now),
            date: now,
            read: false,
            avatar: "/placeholder.svg?height=40&width=40", // You might want to use member's avatar if available
            actionUrl: "/settings", // Could also be `/members/${member._id}` to view specific member
            priority: "low"
        };

        const notification = new Notification(notificationData);
        await notification.save();

        console.log(`✅ Notification created for new team member: ${member.name}`);
        return notification;
    } catch (error) {
        console.error(`❌ Failed to create notification for new member ${member.name}:`, error);
        // Don't throw error - notification failure shouldn't break the member creation process
        return null;
    }
};



// GET /api/notifications - Get all notifications (with pagination)
const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Filter options
        const filters = {};
        if (req.query.read !== undefined) {
            filters.read = req.query.read === 'true';
        }
        if (req.query.type) {
            filters.type = req.query.type;
        }
        if (req.query.priority) {
            filters.priority = req.query.priority;
        }

        const notifications = await Notification.find(filters)
            .sort({ date: -1 }) // Most recent first
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments(filters);
        const unreadCount = await Notification.countDocuments({ read: false });

        res.json({
            notifications,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            },
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// PUT /api/notifications/:id/read - Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid notification ID format' });
        }

        const notification = await Notification.findByIdAndUpdate(
            id,
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

// PUT /api/notifications/mark-all-read - Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { read: false },
            { read: true }
        );

        res.json({
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
};

// DELETE /api/notifications/:id - Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid notification ID format' });
        }

        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

// GET /api/notifications/stats - Get notification statistics
const getNotificationStats = async (req, res) => {
    try {
        const stats = await Notification.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    unread: { $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] } },
                    byType: {
                        $push: {
                            type: "$type",
                            priority: "$priority",
                            read: "$read"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    unread: 1,
                    read: { $subtract: ["$total", "$unread"] },
                    byType: 1
                }
            }
        ]);

        // Process type statistics
        const typeStats = {};
        const priorityStats = {};

        if (stats.length > 0) {
            stats[0].byType.forEach(item => {
                // Type statistics
                if (!typeStats[item.type]) {
                    typeStats[item.type] = { total: 0, unread: 0 };
                }
                typeStats[item.type].total++;
                if (!item.read) typeStats[item.type].unread++;

                // Priority statistics
                if (item.priority) {
                    if (!priorityStats[item.priority]) {
                        priorityStats[item.priority] = { total: 0, unread: 0 };
                    }
                    priorityStats[item.priority].total++;
                    if (!item.read) priorityStats[item.priority].unread++;
                }
            });
        }

        res.json({
            overview: stats[0] || { total: 0, unread: 0, read: 0 },
            byType: typeStats,
            byPriority: priorityStats
        });
    } catch (error) {
        console.error('Error fetching notification stats:', error);
        res.status(500).json({ error: 'Failed to fetch notification statistics' });
    }
};


const getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({ read: false });

        res.json({
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
};


module.exports = {
    createApplicationNotification,
    createMemberNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStats,
    getUnreadCount,
    createInterviewUpdateNotification,
    createMemberUpdateNotification,
}
