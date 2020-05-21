document.addEventListener('DOMContentLoaded', () => {

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);


    // Set display name of user.
    if (!localStorage.getItem('user')) {
        // Display the form.
        document.querySelector('#display_name').style.display = "block";
        document.querySelector('#name').focus();
        // Save a display name.
        document.querySelector('#display_name').onsubmit = function() {
            var user = document.querySelector('#name').value;
            localStorage.setItem('user', user);
            // Hide the form.
            document.querySelector('#display_name').style.animationPlayState = 'running';
            document.querySelector('#display_name').addEventListener('animationend', () =>  {
                document.querySelector('#display_name').style.display = "none";
            });
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
        localStorage.setItem('group', 'first');
        load_channels('first');
    }


    // Set links up to load channels.
    document.querySelectorAll('.nav-link-top').forEach(link => {
        link.onclick = () => {
            localStorage.setItem('group', link.dataset.group);
            load_channels(link.dataset.group);
            clear_posts();
            return false;
        };
    });


    // Display the creation channel form.
    document.querySelector('.create_channel').onclick = function() {
        document.querySelector('#new_channel').style.display = 'block';
        document.querySelector('#channel').focus();
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
                clear_posts();
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
            if (!user) {
                alert('Type your display name.')
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
            document.querySelectorAll('.nav-link-left').forEach(function(link) {
                if (link.dataset.channel === localStorage.getItem('channel')) {
                    link.classList.add("active_left");
                }
                link.onclick = function() {
                    localStorage.setItem('channel', link.dataset.channel);
                    // Set active channel.
                    document.querySelectorAll('.nav-link-left').forEach (nav => {
                        nav.classList.remove("active_left");
                    });
                    link.classList.add("active_left");
                    load_posts();
                    document.querySelector('#post').focus();

                    return false;
                };
                return false;
            });
        };
        
        const data = new FormData();
        data.append('group', name);

        request.send(data);
        return false;
    }

    // Renders contents of new post.
    function load_posts() {
        const channel = localStorage.getItem('channel');
        clear_posts();       
        
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
        const channel = document.createElement('a');
        channel.href = '';
        channel.className = 'nav-link-left';
        channel.dataset.channel = contents;
        channel.innerHTML = contents;

        // Add channel to DOM.
        document.querySelector('#channels').append(channel);

    }

    
    const post_template_left = Handlebars.compile(document.querySelector('#post_template_left').innerHTML);    
    const post_template_right = Handlebars.compile(document.querySelector('#post_template_right').innerHTML);    

    function add_post(contents) {
        
        // Create new post.
        const date = new Date(parseInt(contents.timestamp));
        let post;
        if (contents.user === user) {
            post = post_template_right({
                'user': contents.user,
                'text': contents.text,
                'timestamp': contents.timestamp,
                'date': date.toLocaleString()});
        }
        else {
            post = post_template_left({
                'user': contents.user,
                'text': contents.text,
                'timestamp': contents.timestamp,
                'date': date.toLocaleString()});
        }            

        // Add post to DOM.
        document.querySelector('#posts').innerHTML += post;
        document.querySelector('#posts').scrollTop = document.querySelector('#posts').scrollHeight;
        
        var modal = document.querySelector('#remove');        
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
                return false;
            }
    
            if (event.target == document.querySelector('.cancelbtn')) {
                modal.style.display = "none";
                const post = document.querySelector('.deleted');
                post.classList.remove('deleted');
                return false;
            }
    
            if (event.target == document.querySelector('.deletebtn')) {
                modal.style.display = "none";
                const post = document.querySelector('.deleted');
                let timein = post.querySelector('p').innerHTML;
                delete_post(timein);
                return false;
            }
            if (event.target == document.querySelector('.deletebtn1')) {
                modal.style.display = "none";
                const post = document.querySelector('.deleted');
                hide_post(post);
                post.classList.remove('deleted');
                return false;
            }
        };

    }
    

    function clear_posts() {
        const posts = document.querySelector('#posts');
        while(posts.firstChild){
            posts.removeChild(posts.firstChild);
        }
        return false;  
    }


    function delete_post(time) {
        const group = document.querySelector('.active_top').dataset.group;
        const channel = document.querySelector('.active_left').dataset.channel;
    
        if (socket.connected) {
            // Add data to send with request
            const data = {
                'group': group,
                'channel': channel,
                'user': user,
                'timestamp': time
            };
        
            // Send request
            socket.emit('delete post', data);
            return false;
        }
    }


    socket.on('deleted post', function(result) {
        if (result.result == false) {
            if (document.querySelector('.deleted')) {
                document.querySelector('.deleted').classList.remove('deleted');
            }
        }
        else {
            if (document.querySelector('.deleted')) {
                hide_post(document.querySelector('.deleted'));
            }
            else {
                document.querySelectorAll('.left').forEach(post => {
                   const post_user = post.querySelector('span').innerHTML; 
                   const post_time = post.querySelector('p').innerHTML;
                   if (post_user === result.user && post_time === result.timestamp) {
                       hide_post(post);
                   }
                });
            }
        }
        return false;
    });

    
    function hide_post(post) {
        post.style.animationPlayState = 'running';
        post.addEventListener('animationend', () =>  {
            post.remove();
            return false;
        });
    }
});