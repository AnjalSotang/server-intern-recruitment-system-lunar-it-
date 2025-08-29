const express = require('express');
const router = express.Router()
const { createPosition,
    deletePostion,
    viewPosition,
    viewPositionById,
    updatePosition,
    getPositionSummary
} =
require("../controller/positionController")
const { checkTokenAndRole } = require('../middleware/checkTokenAndRole');



// Route to create a new position
router.get("/positionSummary", getPositionSummary)

router.post("/position", checkTokenAndRole(['admin']), createPosition)
router.delete("/position/:id", checkTokenAndRole(['admin']), deletePostion)
router.get("/position", checkTokenAndRole(['admin', 'user']), viewPosition)
router.get("/position/:id", viewPositionById)
router.patch("/position/:id",checkTokenAndRole(['admin']), updatePosition)

module.exports = router;