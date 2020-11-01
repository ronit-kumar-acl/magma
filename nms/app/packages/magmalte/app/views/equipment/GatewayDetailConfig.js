/*
 * Copyright 2020 The Magma Authors.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @flow strict-local
 * @format
 */
import type {DataRows} from '../../components/DataGrid';
import type {EnodebInfo} from '../../components/lte/EnodebUtils';
import type {lte_gateway} from '@fbcnms/magma-api';

import ActionTable from '../../components/ActionTable';
import AddEditGatewayButton from './GatewayDetailConfigEdit';
import Button from '@material-ui/core/Button';
import CardTitleRow from '../../components/layout/CardTitleRow';
import DataGrid from '../../components/DataGrid';
import EnodebContext from '../../components/context/EnodebContext';
import GatewayContext from '../../components/context/GatewayContext';
import Grid from '@material-ui/core/Grid';
import JsonEditor from '../../components/JsonEditor';
import React from 'react';
import SettingsIcon from '@material-ui/icons/Settings';
import nullthrows from '@fbcnms/util/nullthrows';

import {colors, typography} from '../../theme/default';
import {makeStyles} from '@material-ui/styles';
import {useContext, useState} from 'react';
import {useEnqueueSnackbar} from '@fbcnms/ui/hooks/useSnackbar';
import {useRouter} from '@fbcnms/ui/hooks';

const useStyles = makeStyles(theme => ({
  dashboardRoot: {
    margin: theme.spacing(3),
    flexGrow: 1,
  },
  appBarBtn: {
    color: colors.primary.white,
    background: colors.primary.comet,
    fontFamily: typography.button.fontFamily,
    fontWeight: typography.button.fontWeight,
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    letterSpacing: typography.button.letterSpacing,

    '&:hover': {
      background: colors.primary.mirage,
    },
  },
}));

export function GatewayJsonConfig() {
  const {match, history} = useRouter();
  const [error, setError] = useState('');
  const gatewayId: string = nullthrows(match.params.gatewayId);
  const enqueueSnackbar = useEnqueueSnackbar();
  const ctx = useContext(GatewayContext);
  const gwInfo = ctx.state[gatewayId];
  const {['status']: _status, ...gwInfoJson} = gwInfo;
  return (
    <JsonEditor
      content={{
        ...gwInfoJson,
        connected_enodeb_serials: gwInfoJson.connected_enodeb_serials ?? [],
      }}
      error={error}
      onSave={async gateway => {
        try {
          await ctx.setState(gatewayId, gateway);
          enqueueSnackbar('Gateway saved successfully', {
            variant: 'success',
          });
          setError('');
          history.goBack();
        } catch (e) {
          setError(e.response?.data?.message ?? e.message);
        }
      }}
    />
  );
}

export default function GatewayConfig() {
  const classes = useStyles();
  const {history, match, relativeUrl} = useRouter();
  const gatewayId: string = nullthrows(match.params.gatewayId);
  const ctx = useContext(GatewayContext);
  const gwInfo = ctx.state[gatewayId];

  function ConfigFilter() {
    return (
      <Button
        className={classes.appBarBtn}
        onClick={() => {
          history.push(relativeUrl('/json'));
        }}>
        Edit JSON
      </Button>
    );
  }

  function editGateway() {
    return (
      <AddEditGatewayButton
        title={'Edit'}
        isLink={true}
        editProps={{
          editTable: 'info',
        }}
      />
    );
  }

  function editAggregations() {
    return (
      <AddEditGatewayButton
        title={'Edit'}
        isLink={true}
        editProps={{
          editTable: 'aggregation',
        }}
      />
    );
  }

  function editEPC() {
    return (
      <AddEditGatewayButton
        title={'Edit'}
        isLink={true}
        editProps={{
          editTable: 'epc',
        }}
      />
    );
  }

  function editRan() {
    return (
      <AddEditGatewayButton
        title={'Edit'}
        isLink={true}
        editProps={{
          editTable: 'ran',
        }}
      />
    );
  }

  return (
    <div className={classes.dashboardRoot}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Grid item xs={12}>
            <CardTitleRow
              icon={SettingsIcon}
              label="Config"
              filter={ConfigFilter}
            />
          </Grid>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6} alignItems="center">
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <CardTitleRow label="Gateway" filter={editGateway} />
                  <GatewayInfoConfig gwInfo={gwInfo} />
                </Grid>
                <Grid item xs={12}>
                  <CardTitleRow
                    label="Aggregations"
                    filter={editAggregations}
                  />
                  <GatewayAggregation gwInfo={gwInfo} />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={6} alignItems="center">
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <CardTitleRow label="EPC" filter={editEPC} />
                  <GatewayEPC gwInfo={gwInfo} />
                </Grid>
                <Grid item xs={12}>
                  <CardTitleRow label="Ran" filter={editRan} />
                  <GatewayRAN gwInfo={gwInfo} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}

function GatewayInfoConfig({gwInfo}: {gwInfo: lte_gateway}) {
  const data: DataRows[] = [
    [
      {
        category: 'Name',
        value: gwInfo.name,
      },
    ],
    [
      {
        category: 'Gateway ID',
        value: gwInfo.id,
      },
    ],
    [
      {
        category: 'Hardware UUID',
        value: gwInfo.device.hardware_id,
      },
    ],
    [
      {
        category: 'Version',
        value: gwInfo.status?.platform_info?.packages?.[0]?.version ?? 'null',
      },
    ],
    [
      {
        category: 'Description',
        value: gwInfo.description,
      },
    ],
  ];

  return <DataGrid data={data} />;
}

function GatewayEPC({gwInfo}: {gwInfo: lte_gateway}) {
  const collapse: DataRows[] = [
    [
      {
        value: gwInfo.cellular.epc.ip_block ?? '-',
      },
    ],
  ];

  const data: DataRows[] = [
    [
      {
        category: 'IP Allocation',
        value: gwInfo.cellular.epc.nat_enabled ? 'NAT' : 'Custom',
        collapse: <DataGrid data={collapse} />,
      },
    ],
    [
      {
        category: 'Primary DNS',
        value: gwInfo.cellular.epc.dns_primary ?? '-',
      },
    ],
    [
      {
        category: 'Secondary DNS',
        value: gwInfo.cellular.epc.dns_secondary ?? '-',
      },
    ],
  ];

  return <DataGrid data={data} />;
}

function GatewayAggregation({gwInfo}: {gwInfo: lte_gateway}) {
  const logAggregation = !!gwInfo.magmad.dynamic_services?.includes(
    'td-agent-bit',
  );
  const eventAggregation = !!gwInfo.magmad?.dynamic_services?.includes(
    'eventd',
  );
  const aggregations: DataRows[] = [
    [
      {
        category: 'Aggregation',
        value: logAggregation ? 'Enabled' : 'Disabled',
        statusCircle: false,
      },
      {
        category: 'Aggregation',
        value: eventAggregation ? 'Enabled' : 'Disabled',
        statusCircle: false,
      },
    ],
  ];

  return <DataGrid data={aggregations} />;
}

function EnodebsTable({enbInfo}: {enbInfo: {[string]: EnodebInfo}}) {
  type EnodebRowType = {
    name: string,
    id: string,
  };
  const enbRows: Array<EnodebRowType> = Object.keys(enbInfo).map(
    (serialNum: string) => {
      const enbInf = enbInfo[serialNum];
      return {
        name: enbInf.enb.name,
        id: serialNum,
      };
    },
  );

  return (
    <ActionTable
      title=""
      data={enbRows}
      columns={[{title: 'Serial Number', field: 'id'}]}
      menuItems={[
        {name: 'View'},
        {name: 'Edit'},
        {name: 'Remove'},
        {name: 'Deactivate'},
        {name: 'Reboot'},
      ]}
      options={{
        actionsColumnIndex: -1,
        pageSizeOptions: [5],
        toolbar: false,
        header: false,
        paging: false,
      }}
    />
  );
}

function GatewayRAN({gwInfo}: {gwInfo: lte_gateway}) {
  const enbCtx = useContext(EnodebContext);
  const enbInfo =
    gwInfo.connected_enodeb_serials?.reduce(
      (enbs: {[string]: EnodebInfo}, serial: string) => {
        if (enbCtx.state.enbInfo[serial] != null) {
          enbs[serial] = enbCtx.state.enbInfo[serial];
        }
        return enbs;
      },
      {},
    ) || {};
  const ran: DataRows[] = [
    [
      {
        category: 'PCI',
        value: gwInfo.cellular.ran.pci,
        statusCircle: false,
      },
      {
        category: 'eNodeB Transmit',
        value: gwInfo.cellular.ran.transmit_enabled ? 'Enabled' : 'Disabled',
        statusCircle: false,
      },
    ],
    [
      {
        category: 'Registered eNodeBs',
        value: gwInfo.connected_enodeb_serials?.length || 0,
        collapse: <EnodebsTable gwInfo={gwInfo} enbInfo={enbInfo} />,
      },
    ],
  ];

  return <DataGrid data={ran} />;
}
