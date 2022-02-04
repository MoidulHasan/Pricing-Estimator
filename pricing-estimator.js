var siOffset = 0;
var peRangeLow = 0;
var peRangeHigh = 0;
var bod = 20;
var categoriesSlider = null;
var itemsSlider = null;
var iscc = false;

// Init Functions
$(document).ready(function() {

    // Set options for datepicker    
    $("#pe-date-input-book").datepicker({
        autoSize: true,
        minDate: 0,
        beforeShow: function(input, inst) {
            $('#ui-datepicker-div').addClass('pe-datepicker');
        }
    });

    // Capture enter press for Zipcode input
    $('#pe-name-input-dropoff, #pe-email-input-dropoff').keypress(function(e) {
        if (e.which == 13) { //Enter key pressed
            $('#btn-start-ai').click();
        }
    });

    // Capture enter press for booking form input
    $("#service-book input, #service-book select").each(function() {

        $(this).keypress(function(e) {
            if (e.which == 13) { //Enter key pressed
                $('#btn-book-appointment').click();
            }
        });
    });

    // Make sure back button leads to correct screen
    $('#back-button').on('click', function(e) {
        e.preventDefault();
        thisStep = parseFloat($(this).attr('data-this-step'));
        prevStep = parseFloat($(this).attr('data-prev-step'));

        if (thisStep == 5) {
            $('#empty-items-dialog').modal('show');
        } else {
            sendEvent('#peModal', prevStep, 'back');
        }

    });

    $('.leave-page').on('click', function(e) {
        e.preventDefault();
        var prevStep = parseFloat($('#empty-items-dialog').attr('data-prev-step'));
        resetPricingViews();
        $('#empty-items-dialog').modal('toggle')
        sendEvent('#peModal', prevStep, 'back');
    });

    // Trigger ajax call to get available times
    $('#pe-date-input-book').on('change', function() {

        PeGetAvailableTimes();

    });

    $('#large-volume-dialog, #empty-items-dialog').on('hidden.bs.modal', function(e) {
        // For dialog boxes, append 'modal-open' class to body to bring focus to pe modal
        $('body').addClass('modal-open');
    });

    // Add/remove pickup trucks
    $('body').on('click', '#row-pickup-trucks .btn-group a.btn', function(e) {
        e.preventDefault();
        var thisAction = $(this).data('action');
        var pickupsTotal = parseFloat($('#pickup-trucks-total').val());
        var pickupsFull = parseInt($('#pickups-full-counter .count').text());
        var pickupsHalf = parseInt($('#pickups-half-counter .count').text());
        var thisItemNameID = 'pickup-trucks';
        var aamount = 0;

        switch (thisAction) {

            case 'add-full':
                aamount = 1;
                $('#pickups-full-counter small').addClass('selected');
                break;
            case 'add-half':
                aamount = .5;
                $('#pickups-half-counter small').addClass('selected');
                break;
            case 'remove-full':
                if (pickupsFull <= 0) { return; }
                aamount = -1;
                break;
            case 'remove-half':
                if (pickupsHalf <= 0) { return; }
                aamount = -.5;
                break;

        }


        // Show large volume modal if size too large
        if (pickupsTotal + aamount > 6) { $('#large-volume-dialog').modal('show'); return; }
        if (pickupsTotal + aamount < 0) { return; }

        pickupsTotal += aamount;
        if (Math.abs(aamount) == 1) pickupsFull += aamount;
        if (Math.abs(aamount) == .5) pickupsHalf += aamount * 2;

        // Set to fixed decimal place for consistent calculations
        pickupsTotal = pickupsTotal.toFixed(1);

        var width = parseInt((pickupsTotal / 6) * 100);


        // Build 'My Items' dropdown item
        ddListItem = '<li id="' + thisItemNameID + '"><a href="#" class="dd-item" data-slide="1" data-screen="4"><span class="count">' + pickupsTotal + '</span>&nbsp;<span class="item-name">Pickup Truck Load(s)</span></a></li>';

        //Update items in 'My Items' dropdown and remove if needed

        // If item exists in dropdown, update, else create
        if ($('.pe-dropdown-menu li#' + thisItemNameID + '').length > 0) {

            $('.pe-dropdown-menu li#' + thisItemNameID + '').replaceWith(ddListItem);
            $('#conf-items-list li#' + thisItemNameID + '').replaceWith(ddListItem);

        } else {

            $('.pe-dropdown-menu').append(ddListItem);
            $('#conf-items-list').append(ddListItem);

        }

        // Remove item from dropdown if count reaches 0
        if (pickupsTotal <= 0) {

            $('#conf-items-list li#' + thisItemNameID + '').remove();
            $('.pe-dropdown-menu li#' + thisItemNameID + '').remove();

        }

        // Enable/disable next step button
        nextStepDisabled = pickupsTotal <= 0 ? true : false;
        $('#btn-book-jk-truck').toggleClass('disabled', nextStepDisabled);

        // Update running totals
        $('.jk-truck-image .progress-bar').css('width', width.toString() + '%');
        $('#jk-progress-string').html(width.toString() + '% ');
        $("#items-running-total").val(pickupsTotal + ' pickup truck loads');
        $('#pickup-trucks-total').val(pickupsTotal);
        $('#pickups-full-counter .count').html(pickupsFull);
        $('#pickups-half-counter .count').html(pickupsHalf);

        GetPricePickUP();

    }); // Add/remove pickup trucks()

    // Add/remove items
    $('body').on('click', '#items-slider .item-data a', function(e) {
        e.preventDefault();
        try {

            var thisAction = $(this).data('action');
            var thisItemName = $(this).parent().attr('data-item-name');
            var thisItemCategory = $(this).parent().attr('data-category');
            var thisItemNameID = thisItemName.replace(/[\s-\(\)&\/]/g, "");
            var thisSlideNumber = $(this).parent().attr('data-slide');
            var thisScreenNumber = $('#back-button').data('this-step');

            // Total count of this item
            var thisItemCount = parseFloat($(this).parent().attr('data-item-totalcount'));
            var thisItemVolume = parseFloat($(this).parent().data('volume')).toFixed(3);
            var thisItemSIOffset = parseInt($(this).parent().data('sioffset'), 10);
            var currTotalVolume = parseFloat($("#total-volume").val());
            var currTotalItems = parseFloat($('#total-items').val());

            // Remove "No Items" message from 'My Items' dropdown
            $('#conf-items-list .no-items, .pe-dropdown-menu .no-items').remove();

            if (thisAction == 'add-item') {

                if (!thisItemCount) { thisItemCount = 0; }
                siOffset = thisItemSIOffset;
                thisItemCount += 1;
                thisItemTotalVolume = thisItemCount * thisItemVolume;
                totalVolume = currTotalVolume - ((thisItemCount - 1) * thisItemVolume) + thisItemTotalVolume;
                currTotalItems++;

                // Add background to selected items
                $(this).parents('li.item').addClass('selected');

            } else if (thisAction == 'remove-item') {

                // Reduce counts on running totals
                thisItemCount = thisItemCount - 1;
                currTotalItems--;

                // Add "No Items" message if count reaches zero
                if (currTotalItems == 0) {
                    $('#conf-items-list, .pe-dropdown-menu').append('<li class="no-items">No Items</li>');
                }

                if (currTotalVolume < 0 || thisItemCount < 0) {

                    thisItemCount = 0;
                    currTotalVolume = 0;
                    return;

                }

                thisItemTotalVolume = thisItemTotalVolume - thisItemVolume;
                totalVolume = currTotalVolume - thisItemVolume;

                // Remove background from selected items if 0
                if (thisItemCount <= 0) {

                    $(this).parents('li.item').removeClass('selected');

                }

            }

            // Check for oversize volume order and display message
            if (totalVolume > 1) {
                $('#large-volume-dialog').modal('show');
                return;
            }

            // Build 'My Items' dropdown item
            ddListItem = '<li id="' + thisItemNameID + '"><a href="#" class="dd-item" data-slide="' + thisSlideNumber + '" data-screen="' + thisScreenNumber + '" data-category="' + thisItemCategory + '"><span class="count">' + thisItemCount + '</span>&nbsp;<span class="item-name">' + thisItemName + '</span></a></li>';

            //Update items in 'My Items' dropdown and remove if needed

            // If item exists in dropdown, update, else create
            if ($('.pe-dropdown-menu li#' + thisItemNameID + '').length > 0) {

                $('.pe-dropdown-menu li#' + thisItemNameID + '').replaceWith(ddListItem);
                $('#conf-items-list li#' + thisItemNameID + '').replaceWith(ddListItem);

            } else {

                $('.pe-dropdown-menu').append(ddListItem);
                $('#conf-items-list').append(ddListItem);

            }

            // Remove item from dropdown if count reaches 0
            if (thisItemCount <= 0) {

                $('#conf-items-list li#' + thisItemNameID + '').remove();
                $('.pe-dropdown-menu li#' + thisItemNameID + '').remove();

            }

            // Enable/disable next step button
            nextStepDisabled = currTotalItems <= 0 ? true : false;
            $('#btn-book-ai').toggleClass('disabled', nextStepDisabled);

            //Update running totals
            $(this).parent().attr('data-item-totalvolume', thisItemTotalVolume);
            $(this).parent().attr('data-item-totalcount', thisItemCount);
            $(this).parents('li.item').children('.item-count').html(thisItemCount);
            $("#total-items").val(currTotalItems);
            $("#items-running-total").val(thisItemName + '(' + thisItemCount + ')');
            $("#total-volume").val(totalVolume.toFixed(3));

            if (currTotalItems == 1) {
                siOffset = parseInt($('.item-data[data-item-totalcount=1]').data('sioffset'), 10);
            }

            GetPriceRange(); // function to get total items price range


        } catch (ex) {
            HandleJSError(ex, ".up:click");
        }
    }); // Add/remove items()

    // Determine which itemsSlider will show when clicking link on categoriesSlider
    $('body').on('click', '#categories-slider .cat-slide', function(e) {
        e.preventDefault();
        $('#categories-slider').find('a').removeClass("active");

        $(this).addClass('active');

        var slide = $(this).attr('data-slide');
        slide = parseInt(slide);

        itemsSlider.goToSlide(slide);

        // Scroll to top of items slide
        $('#add-items-list').animate({ scrollTop: 0 }, 100);

    });

    // Determine which itemsSlider will show when clicking link on 'My Items' dropdown
    $('body').on('click', '.pe-dropdown-menu .dd-item', function(e) {
        e.preventDefault();
        var slide = parseInt($(this).attr('data-slide'));
        var screen = parseInt($(this).attr('data-screen'));
        var category = $(this).data('category');
        var itemName = $(this).children('.item-name').text();

        sendEvent('#peModal', screen); // Slide with the categories/items
        itemsSlider.goToSlide(slide);

        // Remove green border around category icons and add to current category
        $('#categories-slider').find('a').removeClass("active");
        $('#categories-slider').find('a[data-category="' + category + '"]').addClass("active");

        // Scroll to the item which was selected
        elemPos = $('#add-items-list li[title="' + itemName + '"]').position().top;
        $('#add-items-list').animate({ scrollTop: elemPos }, 100);

    });

    // Step 1 events/actions
    $('#peModal').on('shown.bs.modal', function() {
        $('#pe-zip-input').focus();
    })

    // Validate Zipcode input
    $("#pe-zip-submit-btn").on("click", function(e) {
        e.preventDefault();
        isZipValidated = true;
        zipRegex = /^[a-zA-Z][0-9][a-zA-Z] ?[0-9][a-zA-Z][0-9]|[0-9]{5}$/;
        $('#pe-zip-input').val($('#pe-zip-input').val().replace(/([a-z]\d[a-z])(\d[a-z]\d)/gi, '$1 $2'));
        validZip = zipRegex.test($('#pe-zip-input').val());
        if ($('#pe-zip-input').val() == "" || !validZip) {
            isZipValidated = false;
            $('#zip-validation-msg').html('<h4>Please enter a valid zip/postal code.</h4>');
            return;
        }
        $('#customer-zip').val($('#pe-zip-input').val());
        GetPricing();
    });

    // Capture enter press for Zipcode input
    $('#pe-zip-input').keypress(function(e) {
        if (e.which == 13) { //Enter key pressed
            $('#pe-zip-submit-btn').click();
        }
    });

    // Handle cart drop off button clicks
    $('#btn-start-ai').on('click', function(e) {
        e.preventDefault();
        var bookType = $('#book-type').val();
        var nextStep;

        try {
            validForm = validateForm('service-ai-basic-info');

            if (validForm == 0 && GetQSParameterByName("tmode") == "") {

                // Set hidden values for use on book page
                $('#customer-name').val($('#pe-name-input-dropoff').val());
                $('#customer-email').val($('#pe-email-input-dropoff').val());


                $.ajax({
                    cache: false,
                    type: "POST",
                    data: JSON.stringify({ name: $('#pe-name-input-dropoff').val(), email: $('#pe-email-input-dropoff').val(), zip: $('#customer-zip').val() }),
                    dataType: "json",
                    contentType: "application/json",
                    url: "/system/services/pricing-estimator.asmx/SaveContactInfo",
                    success: function(data, status, jqXHR) {
                        GATrackEvent('PricingEstimator', 'SaveContact', $('#customer-name').val() + '|' + $('#customer-email').val() + '|' + $('#customer-zip').val());

                        switch (bookType) {

                            case "items":
                                nextStep = 6;
                                break;

                            case "trucks":
                                nextStep = 4;
                                break;
                        }

                        // All good, move to next step
                        sendEvent('#peModal', nextStep, "forward");


                        // We need to initiate a refresh on the lightSliders in order for them to show properly
                        categoriesSlider.refresh();
                        itemsSlider.refresh();

                    },
                    error: function(jqXHR, status, emsg) {
                        HandleJSError(jqXHR, "PostCartDropoff:error");
                        alert('Ajax error: ' + jqXHR.responseJSON['Message']);
                    }
                });
            }
        } catch (ex) {
            HandleJSError(ex, "PostCartDropoff");
        }

    }); // Cart drop off info

    // Handle Various Button Clicks

    // :Come get my items
    $('#btn-full-service').on('click', function() {
        resetPricingViews();
        $('#pe-dumpster-tc-cb-row').hide();
        if (!iscc) sendEvent('#peModal', 3, "forward");
        else {
            sendEvent('#peModal', 6, "forward");
            // We need to initiate a refresh on the lightSliders in order for them to show properly
            categoriesSlider.refresh();
            itemsSlider.refresh();
        }
    });
    // :Book dumpster
    $('#btn-jk-dumpster').on('click', function() {

        resetPricingViews();
        $('#pe-dumpster-tc-cb-row').show();
        GetPriceDumpster();
        $('#book-type').val('dumpster');
        sendEvent('#peModal', 7, "forward");

    });
    // :By Truck Loads
    $('#btn-fs-truckloads').on('click', function() {

        resetPricingViews();
        $('#book-type').val('trucks');
        if (!iscc) sendEvent('#peModal', 5, "forward");
        else {
            sendEvent('#peModal', 4, "forward");
        }

    });
    // :Add items
    $('#btn-fs-add-items').on('click', function() {

        resetPricingViews();
        $('#book-type').val('items');
        if (!iscc) sendEvent('#peModal', 5, "forward");
        else {
            sendEvent('#peModal', 6, "forward");
            // We need to initiate a refresh on the lightSliders in order for them to show properly
            categoriesSlider.refresh();
            itemsSlider.refresh();

        }

    });

    $('#pe-time-input-book').on('click', function() {

        if ($(this).hasClass('disabled')) { alert("First select a date, then times will show here"); }
    });

    // :Book Appointment
    $('#btn-book-appointment').on('click', function() {

        var validForm = validateForm('service-book');

        if (validForm === 0) {

            if ($('#book-type').val() == "dumpster" && $("#pe-dumpster-tc-cb:checked").length == 0) {
                alert("Please accept the dumpster rental terms and conditions.");
                return;
            }

            // Send data to booking process and show message
            BookPEEstimate();

        }

    });

    // Reformat phone numbers
    $('#pe-phone-input-book').on('blur', function() {

        val = $(this).val();
        newVal = val.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        $(this).val(newVal);
    });

    // Clear out variables if modal is closed
    $('#peModal').on('hidden.bs.modal', function(e) {
        resetAllViews();
    });

    $('#launch-modal').on('click', function(e) {
        e.preventDefault();
        if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
            $.ajaxSetup({ cache: false });
        }

        // Clear all variables at start
        resetAllViews();

        // Reset click path array
        clickPath = [];

        // Enable/disable online discount
        DiscountDisplay(); //



        // Advance to first slide
        sendEvent('#peModal', 1, 'forward');


    }); //.launch-modal()

    try {
        var zip = GetQSParameterByName("zip");
        if (zip && zip != "") {
            iscc = true;
            bod = 0;
            $('#btn-book-ai').hide();
            $('#pe-booking-form').hide();
            $('#launch-modal').click();
            $('#pe-zip-input').val(zip);
            $('#pe-zip-submit-btn').click();
        }
        var start = GetQSParameterByName("start");
        if (start && start != "") {
            $('#launch-modal').click();
        }
    } catch (ex) {
        HandleJSError(ex, "InitPE");
    }


}); // document.ready()

// $('#launch-modal').click();





// Function to handle changing screens
function sendEvent(sel, step, direction) {

    // Auto-scroll to top of screen on screen change
    $('#peModal').animate({ scrollTop: 0 }, 100);

    var sel_event = new CustomEvent('next.m.' + step, {
        detail: {
            step: step
        }
    });
    window.dispatchEvent(sel_event);

    // Hide back button on screens which don't need one
    var hiddenSteps = [1, 8];
    buttonState = hiddenSteps.includes(step) ? false : true;
    $('#back-button').toggle(buttonState);

    // Keep track of screen clicks to populate back button
    switch (direction) {

        case 'forward':
            clickPath.push(step);
            break;

        case 'back':
            clickPath.pop(step);
            break;
    }

    var prevStep = clickPath[clickPath.length - 2];
    $('#back-button, #empty-items-dialog').attr('data-prev-step', prevStep);
    $('#back-button, #empty-items-dialog').attr('data-this-step', step);

    // Screen 1:
    if (step == 1) {
        $('#pe-zip-input').focus();
    }

    // Screen 7: Handle events on Booking Screen
    if (step == 7) {
        $('#pe-name-input-book').val($('#customer-name').val());
        $('#pe-email-input-book').val($('#customer-email').val());
        GATrackEvent('PricingEstimator', 'StartBooking', $('#customer-name').val() + '|' + $('#customer-email').val() + '|' + $('#customer-zip').val());
    }
    // Hide 'My Items' dropdown for Dumpster rentals

    if ($('#book-type').val() == 'dumpster') $('.pe-dropdown').hide();
    else $('.pe-dropdown').show();

} // sendEvent

function DiscountDisplay() {

    if (bod > 0) {
        $('.online-discount-display').show();
        $('.online-discount-amount').text(bod);
    } else {

        $('.online-discount-display').hide();
    }
}


function InitCategoriesAndItems(zipCode) {
    // Init lightSlider(s)
    if (categoriesSlider == null) {
        categoriesSlider = $('#categories-slider').lightSlider({
            item: 4,
            loop: false,
            slideMove: 2,
            easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
            speed: 600,
            pager: false,
            responsive: [{
                    breakpoint: 800,
                    settings: {
                        item: 4,
                        slideMove: 1,
                        slideMargin: 6,
                    }
                },
                {
                    breakpoint: 480,
                    settings: {
                        item: 3,
                        slideMove: 1
                    }
                }
            ]
        });
    }
    if (itemsSlider == null) {
        itemsSlider = $('#items-slider').lightSlider({
            item: 1,
            loop: false,
            slideMove: 1,
            pager: false,
            controls: false,
            enableTouch: false,
            enableDrag: false,
            mode: "fade",
            responsive: [{
                    breakpoint: 800,
                    settings: {
                        item: 1,
                        slideMove: 1,
                        slideMargin: 6,
                    }
                },
                {
                    breakpoint: 480,
                    settings: {
                        item: 1,
                        slideMove: 1
                    }
                }
            ]
        });
    }
    var items = [];

    $.ajax({
        async: false,
        cache: false,
        type: "POST",
        data: JSON.stringify({ zip: zipCode }),
        dataType: "json",
        contentType: "application/json",
        url: "/system/services/pricing-estimator.asmx/GetItemsJSON3",
        success: function(data, status, jqXHR) {
            items = $.parseJSON(data.d);
        },
        error: function(jqXHR, status, emsg) {
            HandleJSError(jqXHR, "GetItemsJSON:error");
            alert('An error occurred submitting ajax request.');
        }
    });
    try {

        // Start with fresh categories, item sliders and 'My Iems' dropdown
        var slideNum = 0;
        $('#categories-slider').html('');
        $('#items-slider').html('');
        $('#conf-items-list, .pe-dropdown-menu').append('<li class="no-items">No Items</li>');

        if (iscc) {
            var pcat = JSON.parse('{"name":"Pickup Truck Loads","icon":"pickup_trucks","items":[{"name":"Full Pickup Truck","volume":0.166667,"offset":0,"icon":"full-pickup"},{"name":"Half Pickup Truck","volume":0.083333,"offset":0,"icon":"half-pickup"}]}');
            items.categories.push(pcat);
        }

        // Loop through Categories from JSON response
        $.each(items.categories, function(key, val) {

            totalItems = 1;
            var str1 = '';
            var str2 = '';
            var str3 = '';
            var categoryText = val.name;
            var catFriendly = categoryText.replace(/_/g, " ");

            str = '<li class="lslide"><a href="#" data-category="' + categoryText + '"data-slide="' + slideNum + '" class="cat-slide"><img class="img-responsive" src="/images/pricing-estimator/ccd/ico_' + val.icon + '.png" /></a><span>' + catFriendly + '</span></li>';

            $('#categories-slider').append(str);
            categoriesSlider.refresh();

            itemsLength = val.items.length;
            halfCeil = Math.ceil(itemsLength / 2);

            // Build item slider slides
            str1 += '<li class="lslide slide-' + slideNum + '" id="' + categoryText + '">';

            // Loop through Items from JSON response
            $.each(val.items, function(key1, val1) {

                // Open 2-column display
                if (totalItems == 1 || totalItems == halfCeil + 1) {
                    str2 += '<div class="col-sm-6 items-col">';
                    str2 += '<ul>';
                }

                var key1;
                var val1;
                var itemName = val1.name;
                var itemTotalVolume = 0;
                if (typeof $('.item-data').data('item-totalvolume') !== 'undefined') {
                    itemTotalVolume = $('.item-data').data('item-totalvolume');
                }
                var itemTotalCount = 0;
                if (typeof $('.item-data').data('item-totalcount') !== 'undefined') {
                    itemTotalCount = $('.item-data').data('item-totalcount');
                }

                // Trim items more than 25 chars to keep to one line
                if (itemName.length > 20) itemName = itemName.substring(0, 20) + '...';

                str2 += '<li class="item" data-toggle="tooltip" title="' + val1.name + '"><span class="item-count">0</span><span class="item-name">' + itemName + '</span><div role="group" class="btn-group item-data" data-slide="' + slideNum + '" data-volume="' + val1.volume + '" data-sioffset="' + val1.offset + '" data-category="' + val.categoryName + '" data-parent="' + val.categoryName + '" data-item-name="' + val1.name + '" data-item-totalcount="' + itemTotalCount + '" data-item-totalvolume="' + itemTotalVolume + '"><a class="btn btn-xs" role="button" data-action="remove-item"><i class="ico-btn-minus"></i></a><a class="btn btn-xs" role="button" data-action="add-item"><i class="ico-btn-plus"></i></a></div></li>';

                // Close 2-column display
                if (totalItems == halfCeil || totalItems == itemsLength) {
                    str2 += '</ul>';
                    str2 += '</div>';
                }

                totalItems++

            });

            str3 += '</li>';

            // Build 2-column items list
            $('#items-slider').append(str1 + str2 + str3);

            itemsSlider.refresh();

            slideNum++;


        });


        //Hack to get slider to show in modal
        itemsSlider.goToSlide(0);



    } catch (ex) {
        HandleJSError(ex, "refreshSlider");
    }

}


function PeGetAvailableTimes() {
    try {
        if ($('#customer-zip').val() == "") {
            return false;
        }
        var isDumpsterBook = isDumpsterBooking();
        $.ajax({
            cache: false,
            type: "POST",
            data: JSON.stringify({ date: $("#pe-date-input-book").val(), zip: $("#customer-zip").val(), isDumpster: isDumpsterBook }),
            contentType: "application/json",
            url: "/system/services/book-online-express.asmx/GetAvailableTimes",
            success: PeOnGetAvailableTimesSuccess,
            error: function(jqXHR, status, emsg) {
                HandleJSError(jqXHR, "GetAvailableTimes:error");
                alert('An error occurred retrieving available times.\n\nPlease call us at 1.888.888.JUNK (5865) to speak with a booking specialist who can help set up your junk removal appointment.');
            }
        });
    } catch (ex) {
        HandleJSError(ex, "GetAvailableTimes");
    }
} // PeGetAvailableTimes()

function PeOnGetAvailableTimesSuccess(data, status, jqXHR) {
    try {
        var availableTimes = data.d;
        $('#pe-time-input-book').children().remove();
        $('#pe-time-input-book').toggleClass('disabled', false);
        var res = "";
        $.each(availableTimes, function() { $('#pe-time-input-book').append($("<option></option>").attr("value", this.value).text(this.text)); if (this.value != "") res += (res != "" ? "," : "") + this.value; });
        $("#pe-time-input-book").focus();
        LogEvent("BookOnline: GetAvailableTimesSuccess", JSON.stringify({ results: res, date: $("#pe-time-input-book").val(), zip: $("#customer-zip").val() }).replace('"__type":"Services.BookOnlineExpress+Option",', ''));
    } catch (ex) {
        HandleJSError(ex, "OnGetAvailableTimesSuccess");
    }
} // PeOnGetAvailableTimesSuccess()

/* Function to return pricing ranges for JK location based on zipcode */
function GetPricing() {
    $('#zip-validation-msg').html("");
    $('#is-dumpster-location').val('false');
    try {
        var zipCode = $('#pe-zip-input').val();
        zipCode = zipCode.replace(/([a-z]\d[a-z])(\d[a-z]\d)/gi, '$1 $2').toUpperCase();
        $("#zip-validation-msg").html("");
        GATrackEvent('PricingEstimator', 'Start', zipCode);
        LogEvent("PricingEstimator: Start", zipCode);
        $.ajax({
            cache: false,
            type: "POST",
            data: JSON.stringify({ zip: zipCode }),
            dataType: "json",
            contentType: "application/json",
            url: "/system/services/pricing-estimator.asmx/GetPricing2",
            success: function(data, status, jqXHR) {
                var results = eval("(" + data.d + ")");
                var nextStep = 2;
                if (results.ServiceProviderId) {
                    $("#pricing-data").data("pd", results.JHPricing);
                    $("#dumpster-data").data("dd", results.DRPricing);
                    $('#customer-zip').val(zipCode);

                    InitCategoriesAndItems(zipCode);

                    // Hide dumpster options for locations that don't offer dumpsters
                    if (results.DRPricing.length == 0) {

                        $('#full-service').removeClass('col-sm-6').addClass('col-sm-12');
                        $('#self-service').hide();
                        $('#is-dumpster-location').val('false');
                        $('#pe-dumpster-tc-cb-row').hide();
                        nextStep = 3;
                        if (!iscc) nextStep = 3;
                        else {
                            nextStep = 6;
                            // We need to initiate a refresh on the lightSliders in order for them to show properly
                            categoriesSlider.refresh();
                            itemsSlider.refresh();
                        }

                    } else {

                        $('#full-service').removeClass('col-sm-12').addClass('col-sm-6');
                        $('#self-service').show();
                        $('#is-dumpster-location').val('true');
                        $('#pe-dumpster-tc-cb-row a').attr("href", results.DRTC);
                        nextStep = 2;

                    }

                    var additionalDisclaimer = '';

                    if (results.ServiceProviderId == "142") { // zip:80237

                        additionalDisclaimer = "** Due to recycling/disposal costs and regulations in Colorado, we must charge an additional $.50 per pound for televisions and monitors.  We keep scales on our truck to provide accurate costs.";
                    }

                    $('#zip-validation-msg').html('<h2>Good news!<br/>We\'ve got you covered.</h2><p class="p-xs-5">Based on your location, you will be working with</p><h4>' + results.ServiceProviderName + '</h4><small class="additional-disclaimer">' + additionalDisclaimer + '</small>');
                    $('.jk-location').html('<i class="fa fa-map-marker"></i> ' + results.ServiceProviderName);
                    $('.jk-zip-code').html(zipCode);
                    peRangeLow = results.PERangeLow;
                    peRangeHigh = results.PERangeHigh;

                    // Success! Set a 3 second delay then move to next screen
                    if (!iscc) setTimeout(function() { sendEvent('#peModal', nextStep, 'forward') }, 2000);
                    else sendEvent('#peModal', nextStep, 'forward');

                } else {
                    var emsg = "<h2>Sorry.<br/>We Don't Serve Your Area Yet.</h2><p>Think there's been a mistake?<br/>Give us a call to ask any questions!<p class=\"jk-phone-logo\">Â 1-888-888-Junk</p>";
                    GATrackEvent('PricingEstimator', 'ZipNotServiced', zipCode);
                    LogEvent("PricingEstimator: ZipNotServiced", zipCode);
                    $('#zip-validation-msg').html(emsg);
                }
            },
            error: function(jqXHR, status, emsg) {
                HandleJSError(jqXHR, "GetPricing:error");
                alert('An error occurred submitting ajax request.');
            }
        });
    } catch (ex) {
        HandleJSError(ex, "GetPricing");
    }
} // GetPricing()

/* Function To Get Estimated Dumpster Price Start */
function GetPriceDumpster() {
    try {

        var pricing = $("#dumpster-data").data("dd");
        var pIdx = 0;
        var startingPrice = Math.floor(pricing[1].StartingPrice);
        var endingPrice = Math.floor(pricing[2].StartingPrice);

        var prStr = endingPrice > startingPrice ? '<span class="jk-red">$' + startingPrice + '-$' + endingPrice + '</span>' : '<span class="jk-red">$' + startingPrice + '</span>';
        var opdStr = bod > 0 ? '<span class="jk-black hidden-xs"> (-$' + bod + ')</span>' : '';
        var ddListItem = '<li><span class="item-name">JK Dumpster</span></li>';

        $('.final-price-range').html(prStr + opdStr);
        $('#conf-items-list').append(ddListItem);

        if (bod > 0) $('.price-discount').html('-($' + bod + ')');
        else $('.price-discount').html('');

        GetPIInfo("dumpster", startingPrice, endingPrice);

    } catch (ex) {
        HandleJSError(ex, ".getPriceDumpster:click");
    }
} // GetPriceDumpster()

/* Function To Get Estimated Pick Up Price Start */
function GetPricePickUP() {
    try {
        var volume = parseFloat($("#pickup-trucks-total").val());
        var calculatedVolume = volume / 6.0;
        if (calculatedVolume > 0) {
            var pricing = $("#pricing-data").data("pd");
            //var pIdx = Math.floor(volume / .5) + 1;

            if (calculatedVolume < .083) pIdx = 0;
            else if (calculatedVolume < .125) pIdx = 1;
            else pIdx = Math.floor((calculatedVolume * 12).toFixed(2)) + 1;


            var basePrice = pIdx >= pricing.length ? pricing[pricing.length - 1].EndingPrice : pricing[pIdx].StartingPrice;
            var foffset = calculatedVolume > .333 ? peRangeHigh : peRangeLow;
            var startingPrice = Math.floor(foffset >= 0 ? basePrice : basePrice + foffset);
            var endingPrice = Math.floor(foffset >= 0 ? basePrice + foffset : basePrice);

            var lbod = bod;
            if (startingPrice < 100) lbod = 0;
            var prStr = endingPrice > startingPrice ? '<span class="jk-red">$' + startingPrice + '-$' + endingPrice + '</span>' : '<span class="jk-red">$' + startingPrice + '</span>';
            var opdStr = lbod > 0 ? '<span class="jk-black hidden-xs"> (-$' + lbod + ')</span>' : '';

            $('.tl-price-range').html(prStr);
            $('.final-price-range').html(prStr + opdStr);

            if (lbod > 0) $('.price-discount').html('-($' + lbod + ')');
            else $('.price-discount').html('');

        } else {
            $('.tl-price-range').html("$0");
            $('.price-discount').html('');
        }

        GetPIInfo("trucks", startingPrice, endingPrice);

    } catch (ex) {
        HandleJSError(ex, ".getPricePickup:click");
    }
} // GetPricePickUP()

/* Function to Show Total Items Price Start */
function GetPriceRange() {

    try {
        var calculatedVolume = parseFloat($("#total-volume").val());
        var itemCount = parseInt($("#total-items").val());

        var pIdx = -1;
        if (itemCount > 0) {

            var pricing = $("#pricing-data").data("pd");
            //pIdx = Math.floor((calculatedVolume * 12).toFixed(2));
            //var basePrice = pricing[pIdx].StartingPrice;
            //pIdx = calculatedVolume < .0415 ? 0 : Math.floor((calculatedVolume * 12).toFixed(2)) + 1;
            //var basePrice = pIdx >= pricing.length ? pricing[pricing.length - 1].EndingPrice : pricing[pIdx].StartingPrice;
            if (calculatedVolume < .083) pIdx = 0;
            else if (calculatedVolume < .125) pIdx = 1;
            else pIdx = Math.floor((calculatedVolume * 12).toFixed(2)) + 1;

            var basePrice = pIdx >= pricing.length ? pricing[pricing.length - 1].EndingPrice : pricing[pIdx].StartingPrice;
            var foffset = itemCount == 1 && $('.pe-dropdown li[id$=PickupTruck]').length == 0 ? siOffset : (calculatedVolume > .333 ? peRangeHigh : peRangeLow);
            var startingPrice = Math.floor(foffset >= 0 ? basePrice : basePrice + foffset);
            var endingPrice = Math.floor(foffset >= 0 ? basePrice + foffset : basePrice);

            var lbod = bod;
            if (startingPrice < 100) lbod = 0;
            var prStr = endingPrice > startingPrice ? '<span class="jk-red">$' + startingPrice + '-$' + endingPrice + '</span>' : '<span class="jk-red">$' + startingPrice + '</span>';
            var opdStr = lbod > 0 ? '<span class="jk-black hidden-xs"> (-$' + lbod + ')</span>' : '';

            $('.ai-price-range').html(prStr);
            $('.final-price-range').html(prStr + opdStr);

            if (lbod > 0) $('.price-discount').html('-($' + lbod + ')');
            else $('.price-discount').html('');

        } else {

            $('.ai-price-range').html("$0");
            $('.price-discount').html('');
            return;
        }


        GetPIInfo("items", startingPrice, endingPrice);

    } catch (ex) {
        var s = "calculatedVolume: " + calculatedVolume + "\r\n";
        s += "itemCount: " + itemCount + "\r\n";
        s += "pIdx: " + pIdx + "\r\n";
        s += "\r\n" + GetPIState();
        HandleJSError(ex, ".getPriceRange:click", s);
    }
} // GetPriceRange()



function validateForm(screenID) {

    // Register different patterns
    emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    nameRegex = /([a-zA-Z][\s-]?)(\s)([a-zA-Z][\s-]?)/;
    phoneRegex = /\(?[0-9]{3}\)?-[0-9]{3}-[0-9]{4}/;
    addressRegex = /[a-zA-Z][\s-]?/;
    dateRegex = /.+/;
    timeRegex = /.+/;

    var totalErrors = 0;

    // Find all form elements
    elemInput = '#' + screenID + ' input[type=text]';
    elemSelect = '#' + screenID + ' select';

    if (GetQSParameterByName("tmode") != "" && screenID == "service-ai-basic-info") return totalErrors;

    // Loop through each form field
    $(elemInput + ',' + elemSelect).each(function() {

        var thisValidType = $(this).attr('data-validate-as');

        switch (thisValidType) {

            case 'email':
                isValid = emailRegex.test($(this).val());
                break;

            case 'name':
                isValid = nameRegex.test($(this).val());
                break;

            case 'address':
                isValid = addressRegex.test($(this).val());
                break;

            case 'phone':
                isValid = phoneRegex.test($(this).val());
                break;

            case 'book-date':
                isValid = dateRegex.test($(this).val());
                break;

            case 'book-time':
                isValid = timeRegex.test($(this).val());
                break;

        }

        if ($(this).val() == '' || isValid == false) {

            // Only add error if it doesn't already exist
            if (!$(this).hasClass('has-error')) {
                $(this).addClass('has-error');
                $(this).after('<span class="has-error-msg">' + $(this).data('error') + '</span>');
            }

            totalErrors++;

        } else {

            $(this).removeClass('has-error');
            $(this).next('.has-error-msg').remove('');

        }

    });

    return totalErrors;

}

function resetAllViews() {

    resetPricingViews();
    resetFormData();
}

function resetPricingViews() {

    $('#book-type').val('');
    resetAddItemsView();
    resetTruckloadsView();

}

function resetAddItemsView() {

    // Clear items list
    $("#items-slider").each(function() {

        $('.item').removeClass('selected');
        $('.item-count').html(0);
        $('.item-data').attr({ "data-item-totalcount": "0", "data-item-totalvolume": "0" });

    });

    // Remove green box around category icons
    $('#categories-slider').find('a').removeClass("active");

    $('#categories-slider li:first-child a').addClass('active');

    $("#total-items").val(0);
    $("#total-volume").val(0);
    $("#items-running-total").val('');
    $('.pe-dropdown-menu').children().remove();
    $('#conf-items-list').children().remove();
    $('.ai-price-range').html("$0");
    $('.price-discount').html('');
    $('#BONotesHF').val('');


    // Disable next step button
    $('#btn-book-ai').toggleClass('disabled', true);

}

function resetTruckloadsView() {

    $('.jk-truck-image .progress-bar').css('width', '0%');
    $('#jk-progress-string').html('0%');
    $("#items-running-total").val('');
    $('.pe-dropdown-menu').children().remove();
    $('#pickup-trucks-total').val(0);
    $('#pickups-full-counter .count').html(0);
    $('#pickups-half-counter .count').html(0);
    $('.tl-price-range').html("$0");
    $('.price-discount').html('');
    $('#conf-items-list').children().remove();
    $('#BONotesHF').val('');

    // Disable next step button
    $('#btn-book-jk-truck').toggleClass('disabled', true);
}

function resetFormData() {

    $('#pe-zip-input').val('');
    $('#conf-items-list').children().remove();
    $('#customer-zip').val('');
    $('#customer-name').val('');
    $('#customer-email').val('');
    $('#pe-name-input-dropoff').val('');
    $('#pe-email-input-dropoff').val('');
    $('#pe-name-input-book').val('');
    $('#pe-email-input-book').val('');
    $('#pe-address-input-book').val('');
    $('#pe-phone-input-book').val('');
    $('#pe-date-input-book').val('');
    $('#pe-time-input-book').html('<option value="">-- Select Time --</option>');
    $('#pe-time-input-book').toggleClass('disabled', true);

    //Error messages
    $('#zip-validation-msg').html('');
    $('#dropoff-validation-msg').html('');

    //Pricing and confirmation messages
    $('.final-price-range').html('');
    $('#BONotesHF').val('');


}

// Builds payload list of items added to estimator to be sent via booking process
function GetPIInfo(piType, startingPrice, endingPrice) {
    try {

        var piInfo = "";
        var totalItemsList = "";
        var confItemsList = [];


        switch (piType) {

            case "trucks":
                piInfo = $('#pickup-trucks-total').val() + ' truck(s), price: $' + startingPrice + ' - $' + endingPrice;
                break;


            case "items":
                $('#conf-items-list .dd-item span').each(function() {

                    confItemsList.push($(this).text());

                });

                for (var i = 0; i < confItemsList.length; i++) {

                    var ItemsList = {};

                    ItemsList.count = confItemsList[i];
                    i++;
                    ItemsList.name = confItemsList[i];

                    totalItemsList += '(' + ItemsList.count + ')' + ItemsList.name + ', ';

                }

                piInfo = totalItemsList + 'price: $' + startingPrice + ' - $' + endingPrice;
                break;

            case "dumpster":
                piInfo = 'JK Dumpster, price: $' + endingPrice;

        }
        piInfo += " - Online Pricing Estimator";

        $("#BONotesHF").val(piInfo);

    } catch (ex) {
        HandleJSError(ex, "GetPIInfo");
    }
}

function BookPEEstimate() {
    try {

        if ($('#customer-zip').val() == "") {
            alert("Please call us at 1-888-888-5865 to speak with a booking specialist who can help set up your junk removal appointment.");
            return false;
        }
        TogglePEButtonAndSpinner(false);
        var name = $('#pe-name-input-book').val().trim();
        var nparts = name.split(' ');
        var fname = nparts[0].trim();
        var lname = nparts.length > 2 ? nparts.slice(1).join(' ') : nparts[1];
        var phone = $('#pe-phone-input-book').val();
        var email = $('#pe-email-input-book').val();
        var address = $('#pe-address-input-book').val();
        var zip = $('#customer-zip').val();
        var date = $('#pe-date-input-book').val();
        var time = $('#pe-time-input-book').val();
        var pcode = $('#bf-promo-code').val();
        var howheard = "";
        var howheardother = "";
        var itemlist = '';
        var appointmentTypeId = "1";
        var notes = $('#BONotesHF').val();
        var ref = "";
        var lpage = "";
        var ainfo = "";
        var isDumpsterBook = isDumpsterBooking();
        try {
            var piCookie = ReadCookie("page-info");
            if (piCookie != null) {
                var vobj = JSON.parse(piCookie);
                ref = vobj.r;
                lpage = vobj.lp;
            }
        } catch (ex) {
            HandleJSError(ex, "SaveAppointment-ReadCookie");
        }
        try {
            var alCookieVal = ReadCookie("_adl_id.AL_823");
            if (alCookieVal != null) ainfo += (ainfo == "" ? "" : ";") + "alsid:" + alCookieVal;
        } catch (ex) {}

        $('#ItemsCBList input:checked').each(function() { itemlist += (itemlist != '' ? ',' : '') + this.value; });
        LogEvent("BookOnline: SaveAppointment-Start", GetFormData());
        GATrackEvent('BookOnline', 'SaveAppointment', email + '|' + zip + '|' + date + '|' + time);
        GATrackEvent('PricingEstimator', 'Booked', email + '|' + zip + '|' + date + '|' + time);
        BingTrackEvent('SaveAppointment', '', '', 0);

        var saurl = "/system/services/book-online-express.asmx/SaveAppointment";
        if (email == "dp22193-2@gmail.com") saurl = "/system/services/book-online-express.asmx/SaveAppointmentTest";
        if (pcode) ainfo += (ainfo == "" ? "" : ";") + "pcode:" + pcode;

        $.ajax({
            cache: false,
            type: "POST",
            data: JSON.stringify({ fname: fname, lname: lname, phone: phone, email: email, address: address, zip: zip, date: date, time: time, itemList: itemlist, notes: notes, howheard: howheard, howheardother: howheardother, appointmentTypeId: appointmentTypeId, userAgent: navigator.userAgent, boUrl: window.location.href, landingPage: lpage, referringPage: ref, additionalInfo: ainfo, isDumpster: isDumpsterBook }),
            dataType: 'json',
            contentType: "application/json",
            url: saurl,
            success: function(data, status, emsg) {

                $.getScript("/system/scripts/conversion-tracking.js");
                if (msc != "") $.getScript("/system/scripts/ms-conversion-tracking.js");


                var saresult = data.d;
                var jkcode = saresult.JKNumber;
                var preauth = saresult.PreauthorizationEnabled;
                LogEvent("BookOnline: SaveAppointment-Success", "JK #: " + jkcode);
                if (typeof PESaveAppointmentSuccess == 'function') { PESaveAppointmentSuccess(jkcode); }

                sendEvent('#peModal', 8, "forward");

                bfName = $('#pe-name-input-book').val();
                bfEmail = $('#pe-email-input-book').val();
                bfAddress = $('#pe-address-input-book').val();
                bfZip = $('#customer-zip').val();
                bfPhone = $('#pe-phone-input-book').val();

                var str = '';
                str += '<div>' + bfName + '</div>';
                str += '<div>' + bfEmail + '</div>';
                str += '<div>' + bfAddress + '</div>';
                str += '<div>' + bfZip + '</div>';
                str += '<div>' + bfPhone + '</div>';

                $('#conf-confirmation-number').html(jkcode);
                $('#conf-customer-info').html(str);
                TogglePEButtonAndSpinner(true);


            },
            error: function(jqXHR, status, emsg) {
                HandleJSError(jqXHR, "SaveAppointment:error");
                alert('An error occurred saving your appointment.\n\nPlease call us at 1.888.888.JUNK (5865) to speak with a booking specialist who can help set up your junk removal appointment.');
                TogglePEButtonAndSpinner(true);
            }
        });
    } catch (ex) {
        HandleJSError(ex, "SaveAppointment");
    }
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function isDumpsterBooking() {

    isDumpsterBook = $('#book-type').val() == 'dumpster' ? true : false;
    return isDumpsterBook;
}

function TogglePEButtonAndSpinner(buttonEnabled) {
    if (!buttonEnabled) {
        $(".book-it-btn").prop("disabled", true);
        $(".bf-spinner").show();
    } else {
        $(".book-it-btn").prop("disabled", false);
        $(".bf-spinner").hide();
    }
}

function GetPIState() {
    try {
        var s = "Zip: " + $("#pe-zip-input").val() + "\r\n";
        s += "Email: " + $('#pe-email-input').val() + "\r\n";
        s += "Active Tab: " + $(".item-truck-tab .active").children("a").text() + "\r\n";
        s += "Volume: \tItems: " + $("#total-volume").val() + "\t\tTruck: " + $(".pickup").html() + "\r\n";
        s += "StartPrice: \tItems: " + $("#pe-tabs-1 .startRangeValue").text() + "\t\tTruck: " + $("#pe-tabs-2 .startRangeValue1").text() + "\r\n";
        s += "EndPrice: \tItems: " + $("#pe-tabs-1 .endRangeValue").text() + "\t\tTruck: " + $("#pe-tabs-2 .endRangeValue1").text() + "\r\n";
        s += "Pricing Data: \r\n\r\n" + JSON.stringify($("#pricing-data").data("pd")) + "\r\n\r\n";
        var d = {};
        d.Items = [];
        $(".leftAccordionHeader").each(function() {
            var cat = $(this).text();
            var classes = $(this).attr("class");
            var itemsDivSel = "." + classes.split(" ")[0].replace("header", "");
            $(itemsDivSel + " .innerContainer").each(function() {
                var itemName = $(".nameValue", $(this)).text();
                var itemCount = parseInt($(itemsDivSel + "CountInput", $(this)).text());
                if (itemCount > 0) {
                    var di = {};
                    di.CategoryName = cat;
                    di.ItemName = itemName;
                    di.ItemCount = itemCount;
                    d.Items.push(di);
                }
            });
        });
        s += "Items: \r\n\r\n" + JSON.stringify(d.Items) + "\r\n";
        return s;
    } catch (ex) {
        HandleJSError(ex, "GetPIState");
    }
}