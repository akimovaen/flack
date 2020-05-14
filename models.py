class Post:

    def __init__(self, user, timestamp, text):
        self.user = user
        self.timestamp = timestamp
        self.text = text

    def post_info(self):
        return {'user': self.user, 'timestamp': self.timestamp, 'text': self.text}


class Channel:
    counter = 0

    def __init__(self, name):
        self.name = name
        self.posts = []

    def add_post(self, post):
        id = Channel.counter
        if len(self.posts) == id:
            self.posts.append(post.post_info())
        else:
            self.posts.remove(self.posts[0])
            self.posts.append(post.post_info())
        
        Channel.counter += 1

        if id == 99:
            Channel.counter = 98

    def post_list(self):
        return self.posts

class Group:

    def __init__(self, name):
        self.name = name
        self.channels = []

    def add_channel(self, ch):
        self.channels.append(ch)

