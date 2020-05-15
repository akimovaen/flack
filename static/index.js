document.addEventListener('DOMContentLoaded', () => {

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // Set display name of user.
    if (!localStorage.getItem('user')) {
        // Display the form.
        document.querySelector('#display_name').style.display = "block";
        // Save a display name.
        document.querySelector('#display_name').onsubmit = function() {
            var user = document.querySelector('#name').value;
            localStorage.setItem('user', user);
            // Hide the form.
            document.querySelector('#display_name').style.display = "none";
        };
    }    
    // Load display name of user.
    else {
        var user = localStorage.getItem('user');
    }

    // Load the start group.
    if (localStorage.getItem('group')) {
        load_channels(localStorage.getItem('group'));
        load_posts();
    }    
    else {
        load_channels('first');
    }

    // Set links up to load channels.
    document.querySelectorAll('.nav-link-top').forEach(link => {
        link.onclick = () => {
            localStorage.setItem('group', link);
            load_channels(link.dataset.group);
            return false;
        };
    });

    // Display the creation channel form.
    document.querySelector('#create_channel').onclick = function() {
        document.querySelector('#new_channel').style.display = 'block';
        return false;
    };

    // Create a new channel.
    document.querySelector('#new_channel').onsubmit = function() {
        const request = new XMLHttpRequest();
        const new_channel = document.querySelector('#channel').value;
        const group = document.querySelector('.active_top').dataset.group;
        request.open('POST', '/create_channel');

        // Hide the creation channel form.
        document.querySelector('#channel').value = '';
        document.querySelector('#new_channel').style.display = 'none';
        
        // Callback function for when request completes
        request.onload = () => {
            // Extract JSON data from request
            const data = JSON.parse(request.responseText);
            // Update the result div
            if (data.success) {
                localStorage.setItem('channel', new_channel);                
                load_channels(group);
            }
            else {
                alert(data.message);
            }
        };

        // Add data to send with request
        const data = new FormData();
        data.append('new_channel', new_channel);        
        data.append('group', group);        

        // Send request
        request.send(data);
        return false;
    };

    // When connected, configure submitting new_post
    socket.on('connect', () => {
    
        // Create a new post.
        document.querySelector('#new_post').onsubmit = function() {
            const new_post = document.querySelector('#post').value;
            const group = document.querySelector('.active_top').dataset.group;
            let channel;
            if (localStorage.getItem('channel')) {
                channel = localStorage.getItem('channel');
            }    
            else {
                alert('Select a channel');
            }

            // Clear the creation post form.
            document.querySelector('#post').value = '';
        
            // Add data to send with request
            const data = {
                'new_post': new_post,
                'group': group,
                'channel': channel,
                'user': user,
                'timestamp': Date.now()
            };
        
            // Send request
            socket.emit('submit post', data);
            return false;
        };
    });

    // When a new post is announced, add to the unordered list
    socket.on('announce post', function(data) {
        console.log('PONG!');
        add_post(data);
    });
    
    // Renders contents of new channel.
    function load_channels(name) {
        // Set active group.
        document.querySelectorAll('.nav-link-top').forEach (link => {
            link.classList.remove("active_top");
            if (link.dataset.group === name) {
                link.classList.add("active_top");                
            }
            return false;
        });
        
        const channels = document.querySelector('#channels');
        while(channels.firstChild){
            channels.removeChild(channels.firstChild);
        }
        
        const request = new XMLHttpRequest();
        request.open('POST', `/channels`);
        request.onload = () => {
            const data = JSON.parse(request.responseText);
            data.forEach(add_channel);
            
            // Set links up to load posts.
            document.querySelectorAll('._link_left').forEach(function(link) {
                link.onclick = function() {
                    localStorage.setItem('channel', link.dataset.channel)
                    load_posts();
                    return false;
                };
            });
        };
        
        const data = new FormData();
        data.append('group', name);

        request.send(data);
        return false;
    }

    // Renders contents of new post.
    function load_posts() {
        // Set active channel.
        const channel = localStorage.getItem('channel');
        document.querySelectorAll('._link_left').forEach (link => {
            link.classList.remove("active_left");
            if (link.dataset.channel === channel) {
                link.classList.add("active_left");
            }
            return false;
        });
        
        const posts = document.querySelector('#posts');
        while(posts.firstChild){
            posts.removeChild(posts.firstChild);
        }
        
        const request = new XMLHttpRequest();
        request.open('POST', `/posts`);
        request.onload = () => {
            const response = JSON.parse(request.responseText);
            response.forEach(add_post);
        };

        // Add data to send with request
        const data = new FormData();
        const group = document.querySelector('.active_top').dataset.group;
        data.append('channel', channel);
        data.append('group', group);

        request.send(data);
        return false;
    }

    // Add a new channel with given contents to DOM.
    function add_channel(contents) {
        // Create new channel.
        const p = document.createElement('p');
        const channel = document.createElement('a');
        channel.href = '';
        channel.className = '_link_left';
        channel.dataset.channel = contents;
        channel.innerHTML = contents;
        p.appendChild(channel);

        // Add channel to DOM.
        document.querySelector('#channels').append(p);
    }
        
    function add_post(content) {
        // Create new post.
        const post = document.createElement('div');
        post.className = 'post';
        
        if (content.user === user) {
            post.classList.add = 'right';
        }
        else {
            post.classList.add = 'left';
        }

        const display_name = document.createElement('span');
        display_name.innerHTML = content.user;
        post.appendChild(display_name);

        const message = document.createElement('div');
        message.innerHTML = content.text;
        post.appendChild(message);

        const time = document.createElement('time');
        const date = new Date(parseInt(content.timestamp));
        time.innerHTML = date.toLocaleString();
        post.appendChild(time);
  
        // Add post to DOM.
        document.querySelector('#posts').append(post);
    }
});