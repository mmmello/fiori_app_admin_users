sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/format/NumberFormat"
],
    function (Controller, NumberFormat) {
        "use strict";

        var Formatter = {

            date: function (value) {
                var oConfiguration = sap.ui.getCore().getConfiguration();
                var oLocale = oConfiguration.getFormatLocale();
                var oPattern = "";

                if (oLocale === "pt-BR") oPattern = "dd/MM/yyyy"
                else oPattern = "MM/dd/yyyy"


                if (value) {
                    let year = new Date().getFullYear();
                    if (year === 9999) {
                        return "";
                    } else {
                        var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                            //style: "short"
                            pattern: oPattern
                        });

                        return oDateFormat.format(new Date(value));
                    }
                } else {
                    return value;
                }
            },

            statusProduto: function (value) {
                var oBundle = this.getView().getModel("i18n").getResourceBundle();

                try {
                    return oBundle.getText("status" + value);
                } catch (err) {
                    return "";
                }
            },

            stateProduto: function (value) {
                try {
                    if (value === "E") {
                        return "Success";
                    } else if (value === "P") {
                        return "Warning";
                    } else if (value === "F") {
                        return "Error";
                    } else {
                        return "None";
                    }
                } catch (err) {
                    return "None";
                }
            },

            changeIcon: function (value) {
                try {
                    if (value === "E") {
                        return "sap-icon://sys-enter-2";
                    } else if (value === "P") {
                        return "sap-icon://alert";
                    } else if (value === "F") {
                        return "sap-icon://status-error";
                    } else {
                        return "";
                    }
                } catch (err) {
                    return "";
                }
            },

            floatNumber: function (value) {
                var numberFloat = NumberFormat.getFloatInstance({
                    maxFractionDigits: 2,
                    minFractionDigits: 2,
                    groupingEnabled: true,
                    groupingSeparator: ".",
                    decimalSeparator: ","
                });

                return numberFloat.format(value);
            },

            dateSAP: function (value) {

                if (value) {

                    var dateParts = value.split("/");

                    var dateObject = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);

                    var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({

                        pattern: "yyyy-MM-ddTHH:mm:ss"

                    });

                    return oDateFormat.format(new Date(dateObject));

                } else {
                    return value;
                }
            }
        };

        return Formatter;

    }, true);

