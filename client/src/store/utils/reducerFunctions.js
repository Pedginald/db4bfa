export const addMessageToStore = (state, payload) => {
  const { message, sender } = payload;
  // if sender isn't null, that means the message needs to be put in a brand new convo
  if (sender !== null) {
    const newConvo = {
      id: message.conversationId,
      otherUser: sender,
      messages: [message],
    };
    newConvo.latestMessageText = message.text;
    newConvo.newNotifications++;
    return [newConvo, ...state];
  }

  return state.map((convo) => {
    if (convo.id === message.conversationId) {
      const convoCopy = { ...convo };
      convoCopy.messages = [ ...convoCopy.messages, message ]
      convoCopy.latestMessageText = message.text;
      if (message.senderId === convoCopy.otherUser.id) {
        convoCopy.newNotifications++;
      }
      return convoCopy;
    } else {
      return convo;
    }
  });
};

export const addOnlineUserToStore = (state, id) => {
  return state.map((convo) => {
    if (convo.otherUser.id === id) {
      const convoCopy = { ...convo };
      convoCopy.otherUser.online = true;
      return convoCopy;
    } else {
      return convo;
    }
  });
};

export const removeOfflineUserFromStore = (state, id) => {
  return state.map((convo) => {
    if (convo.otherUser.id === id) {
      const convoCopy = { ...convo };
      convoCopy.otherUser.online = false;
      return convoCopy;
    } else {
      return convo;
    }
  });
};

export const addSearchedUsersToStore = (state, users) => {
  const currentUsers = {};

  // make table of current users so we can lookup faster
  state.forEach((convo) => {
    currentUsers[convo.otherUser.id] = true;
  });

  const newState = [...state];
  users.forEach((user) => {
    // only create a fake convo if we don't already have a convo with this user
    if (!currentUsers[user.id]) {
      let fakeConvo = { otherUser: user, messages: [] };
      newState.push(fakeConvo);
    }
  });

  return newState;
};

export const addNewConvoToStore = (state, recipientId, message) => {
  return state.map((convo) => {
    if (convo.otherUser.id === recipientId) {
      const convoCopy = { ...convo };
      convoCopy.id = message.conversationId;
      convoCopy.messages = [ ...convoCopy.messages, message ]
      convoCopy.latestMessageText = message.text;
      return convoCopy;
    } else {
      return convo;
    }
  });
};

export const updateReadStatusInStore = (state, conversationId, updatedMessages, userId) => {
  return state.map((convo) => {

    if (convo.id === conversationId) {
      const convoCopy = { ...convo };
      let updatedMessageIndex = updatedMessages.length - 1;
      let messageIndex = convoCopy.messages.length - 1;

      userId && (convoCopy.lastReadMessageId = updatedMessages[updatedMessageIndex].id);

      while (updatedMessageIndex >= 0) {
        if (convoCopy.messages[messageIndex].id === updatedMessages[updatedMessageIndex].id) {
          convoCopy.messages[messageIndex].read = true;
          
          convoCopy.messages[messageIndex].senderId === convoCopy.otherUser.id && 
            convoCopy.newNotifications--;

          updatedMessageIndex--;
        }
        messageIndex--;
      }
      return convoCopy;
    } else {
      return convo;
    }
  });
};
