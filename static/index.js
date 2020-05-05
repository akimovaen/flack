document.addEventListener('DOMContentLoaded', () => {
    // Set display name of user.
    if (!localStorage.getItem('user')) {
        document.querySelector('#display_name').style.display = "block";
        document.querySelector('#display_name').onsubmit = function() {
            var user = document.querySelector('#name').value;
            localStorage.setItem('user', user);
            document.querySelector('#display_name').style.display = "none";
        };
    }
    
    // Load display name of user.
    else {
        var user = localStorage.getItem('user');
    }
        
    document.querySelector('#user').innerHTML = user;

});