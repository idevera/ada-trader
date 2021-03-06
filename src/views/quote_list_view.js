import Backbone from 'backbone';
import QuoteView from 'views/quote_view';

const QuoteListView = Backbone.View.extend({
  initialize(params) {
    this.template = params.template;
    this.bus = params.bus;
    this.listenTo(this.model, 'update', this.render);

    // SEE TRIGGER IN SELLORDER AND BUYORDER IN ORDER_LIST_VIEW
    this.listenTo(this.bus, 'compareToMarketPrice', this.checkSubmittedOrderPrice);
  },

  render() {
    this.model.each((quote) => {
      const quoteView = new QuoteView({
        model: quote,
        template: this.template,
        tagName: 'li',
        className: 'quote',
        bus: this.bus,
      });

      this.$('#quotes').append(quoteView.render().$el);
    });

    // SEE THE ORDER LIST VIEW FOR THE LISTEN TO RENDER MESSAGE
    this.bus.trigger('append_symbols', this.model);
    return this;
  },

  checkSubmittedOrderPrice(order) {
    const quote = this.model.findWhere({symbol: order.get('symbol')});
    const $errorDisplay = this.$('.form-errors');

    if (!quote) {
      $errorDisplay.append(`<p>There are no current quotes available that match your request</p>`);
      return;
    }

    if (order.get('price') >= parseFloat(quote.get('price')) || (order.get('price') < 0)) {
      $errorDisplay.append(`<p>Your order must be less than the current market price and greater than 0!</p>`);
    } else {
      this.bus.trigger('checkValidations', order);
    }
  },
});

export default QuoteListView;
