Gen-z Ditionary is an online dictionary for gen-z slangs. A site resource that stores, displays and updates Gen-z slangs.
the layout is simple and precise with an index and directory for slangs with each letter, just like a standard dictionary.

USE CASE:
1. Guest users can visit the site and use its dictionary resource without sign up. that is the letter index to search for slangs and their respective meanings.
2. new users that sign up with their email and select username in the sign up section are allowed certain perks unlike guest users.
3. new users that have succesfully signed up are given access to upload new slangs and their meanings to the dictionary as well as comment and like on existing slangs.
4. each slang uploaded by a new user will be logged and awaiting approval by admin before it is succesfully uploaded to the dictionary.
5. every approved upload by a new user will be displayed in the dictionary according to the indx of selected slang and the user will be awarded a star for each approved upload.
6. active users can login to their page which allows for slang uploads and view profile stars and rewards.


INDEX.HTML
1. index page will have a "search slang", view all slang posts, and letter index A-Z.
2. index page will have a profile icon which leads to sign up for guest/new users.
3. for existing users profile icon will lead to profile page which displays basic account info like email, username, star reward count.
4. index page will have a dark or light theme.
5. contact support option to mail(timone427@gmail.com)
6. repsonsive for mobile, tab and desktop.
7. the code base for the project is html, css, javascript.
8. each slang layout should have:
-  (slang) - (meaning)
   (example sentence)

LOGIN/SIGN UP PAGE
1. login allows active users access their profile and upload new slang posts to the dictionary, as well as share comments and like/dislike on existing slangs 
2. sign up for guest/new users requires email and username.
3. login for admin page requires a special username(@admin19) and email(timone427@gmail.com).

ADMIN PAGE
1. admin page will have a special email(timone427@gmail.com) and username(@admin19) which automatically redirects to the admin page.
2. all uploaded slangs by users will be logged in admin and can only be displayed in the dictionary after admin approval.
3. every aprroved user upload should increase the star count for the sepcific user.
4. the admin page will make use of CRUD for new slangs, meanings, example sentence and users. also to manage the user comments slang posts.
5. admin page will allow to edit stars reward count for individual users based on their approved upload count. 
   
AUTH 
1. the auth should check for @username and email in order to log in existing users.
2. the sign up should also take @username and email to create new user account and profile. 
3. the user login session should expire after 20mins of inactivity

NOTES
1. limit dead code and uneccessary reuse of code 