Models Link -https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj



This is a assignment given by Hitesh Chaudhary for a twitter backend . 

Tech Stack- MongoDB with mongoose ,express js and node js


CONTROLLERS and Routes along with Response and Error are written in Production Style in a dedicated manner


List of controllers
- Dashboard
- comments
- likes
- videos
- user 
- healthcheck 
- tweets

<ul>
Main features
<li>1.Authorization is done with a custom middleware using cookies by implementing the concepts of access and refresh tokens with the help of JWT .<li/>
<li>2.Pagination is done with a js library package Aggregate Paginate<li/>
<li>3.Aggregation pipelines are used to fetch data from database where cross model data are required with sub pipelines also written for proper data fetching.<li/>
<li>4.We have also encrypted the passwords and refresh token using library called BCRYPTJS  before saving it in the database to prevent password leaking in case of database leaking.<li/><ul/>