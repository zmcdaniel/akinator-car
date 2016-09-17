var request = require("request");
//script by OverJT, based on https://github.com/devsseb/apinator
var Akinator = function() {
    this.url = 'http://api-usa3.akinator.com/ws/';
    this.session = null;
    this.signature = null;
    this.onAsk = null;
    this.step = 0;
}

Akinator.prototype.hello = function(onAsk, onFound) {
    this.onAsk = onAsk;
    this.onFound = onFound;
    var self = this;
    request(this.url + 'new_session?partner=1&player=Kari', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var rs = JSON.parse(body);
            self.session = rs.parameters.identification.session;
            self.signature = rs.parameters.identification.signature;

            rs = self.extractQuestion(rs);
            self.onAsk(rs.question, rs.answers);

        }
    });
};

Akinator.prototype.extractQuestion = function(response) {
    var parameters = response.parameters;
    if (parameters.step_information)
        parameters = parameters.step_information;

    var question = {
        id: parameters.questionid,
        text: parameters.question
    };
    var answers = [];
    for (var ans in parameters.answers) {
        answers.push({
            id: ans,
            text: parameters.answers[ans].answer
        });
    }
    return {
        question: question,
        answers: answers,
        last: parameters.progression == 100
    };
}

Akinator.prototype.sendAnswer = function(answerId) {
    var self = this;
    request(this.url + 'answer?session=' + this.session + '&signature=' + this.signature + '&step=' + this.step + '&answer=' + answerId, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var rs = JSON.parse(body);
            rs = self.extractQuestion(rs);
            if (rs.last) {
                self.getCharacters();
            } else {
                self.onAsk(rs.question, rs.answers);
            }
        }
    });

    this.step++;
}

Akinator.prototype.getCharacters = function() {
    var self = this;
    request(this.url + 'list?session=' + this.session + '&signature=' + this.signature + '&step=' + this.step + '&size=2&max_pic_width=246&max_pic_height=294&pref_photos=OK-FR&mode_question=0', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var rs = JSON.parse(body);
            var characters = [];
            for (var character in rs.parameters.elements) {
                characters.push({
                    id: rs.parameters.elements[character].element.id,
                    name: rs.parameters.elements[character].element.name,
                    probability: rs.parameters.elements[character].element.proba,
                    photo: rs.parameters.elements[character].element.picture_path
                });

            }
            self.onFound(characters);
        }
    });
    this.step++;
}
