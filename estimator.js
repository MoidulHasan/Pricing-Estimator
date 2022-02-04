// Locations that covers
const locations = new Map([
    [1, "Junk King Portland"],
    [83714, "Junk King Boise"],
]);

let currentPage = 1,
    servicetype = "",
    fullname = "",
    email = "",
    full_truck = 0,
    half_truck = 0,
    pickup_trucks_total = 3.0,
    pickups_full_counter = 0,
    pickups_half_counter = 0;

// Function to go to another page
const goToPage = (nextPage) => {
    $(`#p-${currentPage}`).addClass("d-none");
    $(`#p-${nextPage}`).removeClass("d-none");
    currentPage = nextPage;
};

// append single item
const appendItem = (catagorieName, item) => {
    console.log(item)
    const single_item = `<div id="${item.icon}" class="col-5 row border-1 border-dark border-bottom p-0 m-1">
    <div class="col-9 p-0 m-0">
        <h6 class="text-start"><span id="${item.icon}_count">0</span> ${item.name}</h6>
    </div>
    <div class="col-3 text-end p-0 m-0">
        <div class="btn-group" role="group">
            <button class="btn border-0">
                <i class="fal fa-minus"></i>
            </button>

            <button class="btn border-0">
                <i class="fas fa-plus-square text-danger"></i>
            </button>
        </div>
    </div>
</div>`;
    $(`#${catagorieName}`).append(single_item);
};

// append items by categories
const appendItems = (items) => {
    // console.log(items)
    const items_by_categories = `<div id="${items.icon}" class="col-12 row d-flex justify-content-between p-4 m-0 d-none">
    </div>`;
    $("#item_list").append(items_by_categories)
    console.log(items_by_categories)
    const catagorieName = items.icon;
    items.items.map(item => appendItem(catagorieName, item));

};

const getItemsData = () => {
    $.getJSON("./pricing.json", function(json) {
        json.categories.map(appendItems);
        $("#Couches_and_Chairs").removeClass("d-none");
    });
};

$(document).ready(function() {
    // Action on zip code submission
    $("#zip-submit").click(function() {
        const zipCode = parseInt($("#zip-input").val());
        if (locations.get(zipCode)) {
            const zipValMsg = `<h1>Good news!<br> We've got you covered.</h1><p>Based on your location, you will be working with</p><h3>${locations.get(
                zipCode
            )}</h3>`;
            $("#zipcode-validation-msg").html(zipValMsg);
            const location = `<i class="fa fa-map-marker">${locations.get(
                zipCode
            )}(${zipCode})`;
            $("#p2-location").html(location);
            setTimeout(function() {
                goToPage(2);
            }, 2000);
        } else {
            const zipValMsg = `<h1>Sorry.<br> We Don't Serve Your Area Yet.</h1>
                            <p>Think there's been a mistake?<br>Give us a call to ask any questions!</p>
                            <h6 class="text-center"><span><i class="fas fa-crown"></i></span> 1-888-888-JUNK</h6>`;
            $("#zipcode-validation-msg").html(zipValMsg);
        }
    });

    // Action on previous page button click
    $("#prev-page").click(function() {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    });

    // Action on add-My-Items button click
    $("#add-My-Items").click(function() {
        servicetype = "items";
        goToPage(3);
    });

    // Action on Full Name and email submission
    $("#btn-start-add-item").click(function() {
        fullname = $("#name-input").val();
        email = $("#email-input").val();
        getItemsData();
        goToPage(4);
    });

    // Action on By Pickup Truck Loads button click
    $("#add-by-Pickup-Truck-Loads").click(function() {
        servicetype = "truck";
        goToPage(5);
    });

    // // Action on full pickup load plus
    // $("#full-truck-plus").click(function() {
    //     // $("#progress_bar").removeClass(`w-${full_truck}`);
    //     full_truck = Math.round(full_truck + 16);
    //     $("#progress_bar").css('width', `${full_truck}%`);
    //     $("#space_occopaied").html(`${full_truck}%`);
    // });
    // // Action on full pickup load minus
    // $("#full-truck-minus").click(function() {
    //     full_truck = Math.round(full_truck - 16);
    //     $("#progress_bar").css('width', `${full_truck}%`);
    //     $("#space_occopaied").html(`${full_truck}%`);
    // });










    // Add/remove pickup trucks
    $('body').on('click', '#full-truck-plus, #full-truck-minus', function(e) {
        e.preventDefault();
        var thisAction = $(this).data('action');
        var pickupsTotal = pickup_trucks_total; //parseFloat($('#pickup-trucks-total').val());
        var pickupsFull = pickups_full_counter; //parseInt($('#pickups-full-counter .count').text());
        var pickupsHalf = pickups_half_counter; //parseInt($('#pickups-half-counter .count').text());
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



    function GetPricePickUP() {
        try {
            var volume = pickup_trucks_total;
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
});