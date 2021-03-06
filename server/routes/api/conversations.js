const router = require("express").Router();
const { User, Conversation, Message } = require("../../db/models");
const { Op } = require("sequelize");
const onlineUsers = require("../../onlineUsers");

// get all conversations for a user, include latest message text for preview, and all messages
// include other user model so we have info on username/profile pic (don't include current user info)
router.get("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: {
          user1Id: userId,
          user2Id: userId,
        },
      },
      attributes: ["id"],
      order: [[Message, "createdAt", "DESC"]],
      include: [
        { model: Message },
        {
          model: User,
          as: "user1",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
        {
          model: User,
          as: "user2",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
      ],
    });

    for (let i = 0; i < conversations.length; i++) {
      const convo = conversations[i];
      const convoJSON = convo.toJSON();
      convoJSON.messages = convoJSON.messages.reverse();

      // find amount of unread messages for each conversation
      const unreadMessageCount = await Message.count({
        where: {
          conversationId: convoJSON.id,
          read: false,
          senderId: {
            [Op.not]: userId,
          }
        }
      });

      convoJSON.newNotifications = unreadMessageCount;

      // find last read message of other user
      const lastReadMessageId = await Message.max("id", {
        where: {
          conversationId: convoJSON.id,
          read: true,
          senderId: userId,
        }
      });

      convoJSON.lastReadMessageId = lastReadMessageId;

      // set a property "otherUser" so that frontend will have easier access
      if (convoJSON.user1) {
        convoJSON.otherUser = convoJSON.user1;
        delete convoJSON.user1;
      } else if (convoJSON.user2) {
        convoJSON.otherUser = convoJSON.user2;
        delete convoJSON.user2;
      }

      // set property for online status of the other user
      if (onlineUsers.includes(convoJSON.otherUser.id)) {
        convoJSON.otherUser.online = true;
      } else {
        convoJSON.otherUser.online = false;
      }

      // set properties for notification count and latest message preview
      const latestMessageIndex = convoJSON.messages.length - 1;
      convoJSON.updatedAt = convoJSON.messages[latestMessageIndex].createdAt;
      convoJSON.latestMessageText = convoJSON.messages[latestMessageIndex].text;
      conversations[i] = convoJSON;
    }

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// update read status of all receieved messages in a conversation
router.put("/read", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const { conversationId, userId } = req.body;

    // return early if user is not part of conversation
    const conversation = await Conversation.findByPk(conversationId, {
      where: {
        [Op.or]: {
          user1Id: userId,
          user2Id: userId
        }
      }
    });

    if (!conversation) {
      return res.sendStatus(404);
    }

    const updatedMessages = await Message.update(
      { read: true },
      { where: {
        conversationId,
        read: false,
        senderId: {
          [Op.not]: userId,
        }
      },
      returning: true
    });

    if (!updatedMessages) {
      return res.sendStatus(404);
    }

    res.json(updatedMessages[1]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
