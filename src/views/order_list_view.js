import Backbone from 'backbone';
import Order from 'models/order';
import OrderView from 'views/order_view';

const OrderListView = Backbone.View.extend({
  initialize(params) {
    this.bus = params.bus;
    this.template = params.template;

    // SEE CHECK VALIDATION METHOD FOR THE .ADD TO THE COLLECTION FOR TRIGGER
    this.listenTo(this.model, 'update', this.render);

    // SEE QUOTE_LIST_VIEW RENDER() FOR TRIGGER
    this.listenTo(this.bus, 'append_symbols', this.renderDropDown);

    // SEE QUOTE_LIST_VIEW submittedOrderPRICE FOR TRIGGER
    this.listenTo(this.bus, 'checkValidations', this.checkValidations);

    // SEE QUOTE VIEW RENDER()
    this.listenTo(this.bus, 'checkQuotePrice', this.checkQuotePrice);
  },

  events: {
    'click form button.btn-buy': 'sellOrBuy',
    'click form button.btn-sell': 'sellOrBuy',
  },

  render() {
    this.$('#orders').empty();

    this.model.each((lastOrder) => {
      const orderView = new OrderView({
        model: lastOrder,
        template: this.template,
        tagName: 'li',
        className: 'order',
        bus: this.bus,
      });

      this.$('#orders').append(orderView.render().$el);
    });
    return this;
  },

  //////////// RENDER DROPDOWN OPTIONS BASED ON QUOTES AVAILABLE //////////////

  renderDropDown(quotes) {
    let $selectOptions = this.$('select[name=symbol]');
    
    quotes.forEach((quote) => {
      $selectOptions.append(`<option value="${quote.get('symbol')}">${quote.get('symbol')}</option>`);
    });
  },

  ////////////////////// CREATE BUY ORDER ////////////////////////

  sellOrBuy(event) {
    event.preventDefault();
    this.$('.form-errors').empty();

    const orderData = this.getFormData();
    const sellOrBuy = event.target.classList.value;

    let trueOrFalse;
    if (sellOrBuy === 'btn-sell alert button') {
      trueOrFalse = false;
    } else {
      trueOrFalse = true;
    }

    const order = this.createOrder(trueOrFalse, orderData);

    // SEE CHECK SUBMITTED ORDER PRICE in QUOTE LIST VIEW
    this.bus.trigger('compareToMarketPrice', order);
  },

  ////////////////////////// CREATE ORDER ////////////////////////

  createOrder(trueOrFalse, orderData) {
    const order = new Order({
      symbol: orderData['symbol'],
      price: parseFloat(orderData['price']),
      buy: trueOrFalse,
    });
    return order;
  },

  //////////////////////// FORM DATA ////////////////////////

  getFormData() {
    const data = {};
    data['symbol'] = this.$('form select[name=symbol]').val();
    data['price'] = this.$('form input[name=price-target]').val();
    return data;
  },

  clearFormData() {
    this.$('form input[name=price-target]').val('');
    this.$('form-errors').empty();
  },

  /////////////////////// ERROR DISPLAY ////////////////////////

  displayOrderErrors(errors) {
    const $errorDisplay = this.$('.form-errors');
    $errorDisplay.empty();

    // Iterate over errors hash and display the values
    Object.keys(errors).forEach((key) => {
      $errorDisplay.append(`<p>${errors[key]}</p>`);
    });
  },

  ///////// CHECK VALIDATIONS AND ADD TO THE COLLECTION ///////////

  checkValidations(order) {
    if (order.isValid()) {

      // Triggers update on a collection
      this.model.add(order);
      this.clearFormData();
    } else {
      this.displayOrderErrors(order.validationError);
      order.destroy();
    }
  },

  ////////////// CHECK PRICE OF ORDERS TO QUOTES ///////////////////

  checkQuotePrice(quote) {
    const orders = this.model.where({symbol: quote.get('symbol')});

    if (orders.length > 0) {
      orders.forEach((order) => {
        if (quote.get('price') < order.get('price')) {

          // SEE TRADE VIEW FUNCTION
          this.bus.trigger('add_quote', order.attributes);
          this.model.remove(order);
          order.destroy(); // Trggers a render() in this collection
        }
      });
    }
  },
});

export default OrderListView;
