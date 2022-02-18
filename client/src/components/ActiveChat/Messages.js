import React, { useEffect } from "react";
import { connect } from "react-redux";
import { setReadMessages } from "../../store/utils/thunkCreators";
import { Box } from "@material-ui/core";
import { SenderBubble, OtherUserBubble } from "../ActiveChat";
import moment from "moment";

const Messages = (props) => {
  const { 
    conversationId, 
    messages, 
    otherUser, 
    userId, 
    setReadMessages, 
    lastReadMessageId 
  } = props;

  useEffect(() => {
    if (conversationId) {
      const reqBody = {
        conversationId,
        userId
      }
      setReadMessages(reqBody);
    }
  }, [conversationId, setReadMessages, userId, messages]);

  return (
    <Box>
      {messages.map((message) => {
        const time = moment(message.createdAt).format("h:mm");

        return message.senderId === userId ? (
          <SenderBubble key={message.id} text={message.text} time={time} />
        ) : (
          <OtherUserBubble key={message.id} text={message.text} time={time} otherUser={otherUser} />
        );
      })}
    </Box>
  );
};

// dispatch action to update message read status to props
const mapDispatchToProps = (dispatch) => {
  return {
    setReadMessages: (body) => {
      dispatch(setReadMessages(body));
    }
  }
}

export default connect(null, mapDispatchToProps)(Messages);
