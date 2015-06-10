traverson.registerMediaType(TraversonJsonHalAdapter.mediaType,
    TraversonJsonHalAdapter);

var rootUri = '/';
var api = traverson.from(rootUri);

var View = Backbone.View.extend({
    el: $(".container"),
    initialize: function () {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
    },
    render: function() {
        var $tbody = this.$("#ads-list tbody");
        $tbody.empty();
        _.each(this.model.embedded("ads"), function(data) {
            $tbody.append(new adView({ model : data }).render().el);
        }, this);
    },
    events: {
        "click #createNew": function(e) {
            e.preventDefault();
            var user = form.model.get("user");
            form.model.clear();
            form.model.set("user", user);
            form.model.set("location", {
                city: "Kyiv"
            });
            form.$el.find(".create").removeClass("hide");
        }
    }
});

var adView = Backbone.View.extend({
    tagName : "tr",
    template : _.template($("#ad-template").html()),
    render : function() {
        this.$el.html(this.template(this.model));
        return this;
    },
    events: {
        "click": function(e) {
            form.model.set(this.model);
            ad = new AdsModel(this.model);
            controller.getOperations(ad);
        }
    }
});

var AdsModel = Backbone.RelationalHalResource.extend({
    initialize: function() {
        var self = this;
        api.jsonHal()
            .follow('users', 'search', 'current-user')
            .getResource(function(err, res) {
                if (err) {
                    console.log(err);
                    return;
                }
                self.set("user", res._links.self.href); //TODO
            });
        api.jsonHal()
            .follow('ads', 'search', 'my')
            .getUri(function(err, uri) {
                if (err) {
                    console.log(err);
                    return;
                }
                self.url = uri;
                self.fetch();
            });
    }
});

var ads = new AdsModel();
var ad;


var view = new View({ model: ads }).render();

var order = new Backbone.RelationalHalResource({
    location: { city: "Kyiv" }
});


api.jsonHal()
    .follow('ads')
    .getUri(function(err, uri) {
        if (err) {
            console.log(err);
            return;
        }
        order.url = uri;
    });

var fields = [
    {
        name: "amount",
        label: "Колличество:",
        control: "input",
        type: "number"
    }, {
        name: "currency",
        label: "Тип валюты:",
        control: "input"
    }, {
        name: "rate",
        label: "Курс:",
        control: "input",
        type: "number"
    }, {
        name: "type",
        label: "Тип ордера:",
        placeholder: "BUY or SELL",
        control: "input"
        //TODO control: Backform.SelectControl.extend({ defaults: { options: [{ label: "Купить", value: "BUY" }, { label: "Продать", value: "SELL" }] }})
    },
    {
        name: "create",
        control: "button",
        label: "Создать"
    },
    {
        name: "update hide",
        control: "button",
        label: "Обновить"
    },
    {
        name: "delete hide",
        control: "button",
        label: "Удалить"
    },
    {
        name: "finish hide",
        control: "button",
        label: "Закрыть"
    },
    {
        name: "publish hide",
        control: "button",
        label: "Опубликовать"
    }
];

var form = new Backform.Form({
    el: $("#form"),
    model: order,
    fields: fields,
    events: {
        "click .update": function(e) {
            e.preventDefault();
            this.model.sync("patch", this.model, { url: ad.link("update").href() })
                .done(function(result) {
                    ads.fetch();
                })
                .fail(function(error) {
                    console.error(error);
                });
            return false;
        },
        "click .create": function(e) {
            e.preventDefault();
            this.model.sync("create", this.model)
                .done(function(result) {
                    ads.fetch();
                })
                .fail(function(error) {
                    console.error(error);
                });
            return false;
        },
        "click .publish": function(e) {
            e.preventDefault();
            this.model.sync("create", this.model, { url: ad.link("publish").href() })
                .done(function(result) {
                    ads.fetch();
                })
                .fail(function(error) {
                    console.error(error);
                });
            return false;
        },
        "click .finish": function(e) {
            e.preventDefault();
            this.model.set("status", "OUTDATED");
            this.model.sync("create", this.model, { url: ad.link("finish").href() })
                .done(function(result) {
                    ads.fetch();
                })
                .fail(function(error) {
                    console.error(error);
                });
            return false;
        },
        "click .delete": function(e) {
            e.preventDefault();
            this.model.sync("delete", this.model, { url: ad.link("delete").href() })
                .done(function(result) {
                    ads.fetch();
                })
                .fail(function(error) {
                    console.error(error);
                });
            return false;
        }
    }
});

form.render();

var Controller = function(view) {
    var self = this;
    self.view = view;
    self.view.model.on("change", function() {
        self.view.$el.find(".publish").addClass("hide");
    });
};

Controller.prototype.getOperations =  function(ad) {
    ad.link("update") ?  this.view.$el.find(".update").removeClass("hide") : this.view.$el.find(".update").addClass("hide");
    ad.link("create") ? this.view.$el.find(".create").removeClass("hide") : this.view.$el.find(".create").addClass("hide");
    ad.link("publish") ? this.view.$el.find(".publish").removeClass("hide") : this.view.$el.find(".publish").addClass("hide");
    ad.link("delete") ? this.view.$el.find(".delete").removeClass("hide") : this.view.$el.find(".delete").addClass("hide");
    ad.link("finish") ? this.view.$el.find(".finish").removeClass("hide") : this.view.$el.find(".finish").addClass("hide");
};
var controller = new Controller(form);