var httpserver = require('freeserver');
var Stream = require('stream');

var datamodel = {
		pages:{'Home page':'/','Async request demo':'/asyncdemo','Contact us':'/contact', 'Exception test':'/exceptiontest'},
		request:require('request')
};


var server = httpserver.startServer({ip:'::',port:8080});

var SimpleWeb = server.loadLibrary('lib/simpleweb.js');

server.RegPath('/basetest',function(request,response){
	response.respond('This page can be used as a baseline performance test.');
});


server.RegPath('/', function(request,response){
	server.setModel(datamodel);
	response.respondWithHtml('index.html');
});
server.RegPath('/asyncdemo',function(request,response){
	server.setModel(datamodel);
	response.respondWithHtml('asyncdemo.html');
});

var c = function(cb) {
	var context = server.getContext();
	return function(){
		server.enterContext(context, cb);
	};
};

server.RegPath('/exceptiontest', function(request, response){
	setTimeout(c(function(){
		throw new Error('up');
	}), 5);
});

server.setExceptionHandler(function(er){
	// If we have an exception while we're handling the exception,
	// we're done for.
	server.getContext().exceptionHandler = function(er){
		throw new Error('error');
	};
	datamodel.error = er;
	server.getContext().response.statusCode = 500;
	server.setModel(datamodel);
	server.getContext().response.respondWithHtml('error.html');
});

server.RegPath('/notfound', function(request, response){
	server.setModel(datamodel);
	response.statusCode = 404;
	response.respondWithHtml('notfound.html');
});

server.RegPath('/contact',function(request,response){
	
	
	var contactForm = new SimpleWeb.Form(server);
	var firstName = contactForm.addTextControl('First name','Enter your first name');
	var lastName = contactForm.addTextControl('Last name','Enter your last name');
	datamodel.testform = contactForm;
	contactForm.getData(function(formdata){
		datamodel.firstName = firstName.value;
		datamodel.lastName = lastName.value;
		
		server.setModel(datamodel);
		response.respondWithHtml('contact.html');
		
	});
	
});