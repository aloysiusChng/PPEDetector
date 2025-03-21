import os
from dotenv import load_dotenv
from telegram import Bot

load_dotenv()

# test print TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from .env file
print(os.getenv("TELEGRAM_BOT_TOKEN"))
print(os.getenv("TELEGRAM_CHAT_ID"))

# Creating a Bot object with the token from the .env file
bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))

def send_message():
    # Send a message to the group chat through the bot
    bot.send_message(chat_id=os.getenv("TELEGRAM_CHAT_ID"), text="Hello, World!")

if __name__ == "__main__":
    send_message()