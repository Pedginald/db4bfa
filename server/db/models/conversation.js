const Sequelize = require('sequelize');
const {  Op } = Sequelize;
const db = require("../db");

const Conversation = db.define("conversation", {
  creatorId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  title: {
    type: db.Sequelize.STRING,
    allowNull: false,
  }
});

// find conversation given multiple user Ids

Conversation.findConversation = async function (userIds) {
  const conversation = await Conversation.findOne({
    through: {
      attributes: [],
      where: {
        userId: {
          [Op.in]: userIds
        }
      }
    },
  });

  // return conversation or null if it doesn't exist
  return conversation;
};

module.exports = Conversation;
