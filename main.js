/**
 MIT License

Copyright (c) 2020 Nicholas Schleeter and project contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

var httpserver = require('freeserver');
var Stream = require('stream');

var createDataModel = function() {
	return {
		pages:{'Home page':'/','Async request demo':'/asyncdemo','Contact us':'/contact', 'Exception test':'/exceptiontest'},
		request:require('request')
};
};


var server = httpserver.startServer({ip:'::',port:8080});

var SimpleWeb = server.loadLibrary('lib/simpleweb.js');

server.RegPath('/basetest',function(request,response){
	response.respond('This page can be used as a baseline performance test.');
});

// Use a proper session store for a production app
var sessions = {};

server.RegPath('/', function(request,response){
	var datamodel = createDataModel();
	server.setModel(datamodel);
	var cookies = request.getCookies();
	if(!cookies['session'] || !sessions[cookies['session']]) {
		console.log('Insecure algorithm -- don\'t use this in production. This cookie thing is for demonstration purposes only.');
		var sid = Math.random().toString();
		response.addCookie('session', sid);
		cookies['session'] = sid;
		sessions[sid] = {count:0};
	}
	var sid = cookies['session'];
	sessions[sid].count++;
	datamodel.viewcount = sessions[sid].count;
	response.respondWithHtml('index.html');
});
server.RegPath('/asyncdemo',function(request,response){
	var datamodel = createDataModel();
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
	var datamodel = createDataModel();
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
	var datamodel = createDataModel();
	server.setModel(datamodel);
	response.statusCode = 404;
	response.respondWithHtml('notfound.html');
});

server.RegPath('/contact',function(request,response){
	
	var datamodel = createDataModel();
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